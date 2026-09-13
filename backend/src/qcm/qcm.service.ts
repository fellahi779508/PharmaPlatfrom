import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQcmDto } from './dto/create-qcm.dto';
import { UpdateQcmDto } from './dto/update-qcm.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Qcm } from './entities/qcm.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Course } from 'src/course/entities/course.entity';
import { Td } from 'src/td/entities/td.entity';
import { Tp } from 'src/tp/entities/tp.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as mammoth from 'mammoth';

interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class QcmService {
  constructor(
    @InjectRepository(Qcm) private qcmRepository: Repository<Qcm>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}
  private ai = new GoogleGenAI();

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }
  async create(createQcmDto: CreateQcmDto) {
    return await this.dataSource.transaction(async (manager) => {
      // Validate that at least one container is provided
      if (!createQcmDto.courseId && !createQcmDto.tdId && !createQcmDto.tpId) {
        throw new BadRequestException(
          'At least one of courseId, tdId, or tpId must be provided',
        );
      }

      const qcm = this.qcmRepository.create(createQcmDto);

      if (createQcmDto.courseId) {
        const course = await manager.getRepository(Course).findOne({
          where: { id: createQcmDto.courseId },
        });
        if (!course) {
          throw new NotFoundException(
            this.i18n.t('errors.course.not_found', { lang: this.currentLang }),
          );
        }
        qcm.course = course;
      }

      if (createQcmDto.tdId) {
        const td = await manager
          .getRepository(Td)
          .findOne({ where: { id: createQcmDto.tdId } });
        if (!td) {
          throw new NotFoundException(
            this.i18n.t('errors.td.not_found', { lang: this.currentLang }),
          );
        }
        qcm.td = td;
      }
      if (createQcmDto.tpId) {
        const tp = await manager.getRepository(Tp).findOne({
          where: { id: createQcmDto.tpId },
        });
        if (!tp) {
          throw new NotFoundException(
            this.i18n.t('errors.tp.not_found', { lang: this.currentLang }),
          );
        }
        qcm.tp = tp;
      }

      const savedQcm = await this.qcmRepository.save(qcm);
      for (const answer of createQcmDto.answers) {
        const qcmAnswer = this.dataSource.getRepository(QcmAnswer).create({
          ...answer,
          qcm: savedQcm,
          explanation: answer.explanation,
          isCorrect: answer.isCorrect,
        });
        await this.dataSource.getRepository(QcmAnswer).save(qcmAnswer);
      }
      return savedQcm;
    });
  }

  /**
   * Parses raw text from the MCQ document and inserts QCMs into the database.
   */
  async importQcmsFromText(
    rawText: string,
    courseId: number,
    tdId?: number,
    tpId?: number,
  ) {
    // 1. Split the text into lines and clean them
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const qcmsToCreate: CreateQcmDto[] = [];

    // State variables to hold the current QCM being parsed
    let currentQuestion = '';
    let currentExplanation = '';
    let currentOptions: { letter: string; text: string }[] = [];
    let correctLetters: string[] = [];

    // Regex patterns matching the specific document format
    const questionRegex = /^(\d+)\.\s+(.+)/; // Matches "1. Text..."
    const optionRegex = /^([a-e])\)\s+(.+)/i; // Matches "a) Text..."
    const answerRegex = /^Answer:\s+(.+)/i; // Matches "Answer: A, B, C"
    const explanationRegex = /^Explanation:\s+(.+)/i; // Matches "Explanation: Text..."

    // Helper to format and push the current QCM to our array
    const pushCurrentQcm = () => {
      if (currentQuestion && currentOptions.length > 0) {
        // Map the A, B, C options to your specific DTO answers format
        const answers = currentOptions.map((opt) => ({
          answer: opt.text,
          isCorrect: correctLetters.includes(opt.letter),
          explanation: currentExplanation,
        }));

        qcmsToCreate.push({
          question: currentQuestion,
          courseId,
          tdId,
          tpId,
          answers,
        });
      }
    };

    // 2. Loop through the document line by line
    for (const line of lines) {
      // Detect a new question
      const qMatch = line.match(questionRegex);
      if (qMatch) {
        pushCurrentQcm(); // Save the previous question before starting a new one

        // Reset state for the new question
        currentQuestion = qMatch[2];
        currentOptions = [];
        correctLetters = [];
        currentExplanation = '';
        continue;
      }

      // Detect options (a, b, c, d, e)
      const optMatch = line.match(optionRegex);
      if (optMatch && currentQuestion) {
        currentOptions.push({
          letter: optMatch[1].toUpperCase(),
          text: optMatch[2],
        });
        continue;
      }

      // Detect the correct answers
      const ansMatch = line.match(answerRegex);
      if (ansMatch && currentQuestion) {
        // Splits "A, B, C" into an array ['A', 'B', 'C']
        correctLetters = ansMatch[1]
          .split(',')
          .map((s) => s.trim().toUpperCase());
        continue;
      }

      // Detect the explanation
      const expMatch = line.match(explanationRegex);
      if (expMatch && currentQuestion) {
        currentExplanation = expMatch[1];
        continue;
      }
    }

    // Push the very last question in the file
    pushCurrentQcm();

    // 3. Execute the existing transaction for each parsed QCM
    const savedQcms: any = [];
    for (const dto of qcmsToCreate) {
      // Calls your existing `create` method to safely execute the transaction
      const savedQcm = await this.create(dto);
      savedQcms.push(savedQcm);
    }

    return {
      message: `Successfully imported ${savedQcms.length} QCMs.`,
      data: savedQcms,
    };
  }
  async findAll() {
    return this.qcmRepository.find();
  }
  async findByCourse(courseId: number) {
    return this.qcmRepository.find({
      where: { course: { id: courseId } },
      relations: { answers: true },
    });
  }

  async findOne(id: number) {
    const qcm = await this.qcmRepository.findOne({
      where: { id },
      relations: { answers: true },
    });
    if (!qcm) {
      throw new NotFoundException(
        this.i18n.t('errors.qcm.not_found', { lang: this.currentLang }),
      );
    }
    return qcm;
  }

  async extractQcmsFromFile(file: File) {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    // Define your strict JSON schema matching the DTO
    const qcmSchema: Schema = {
      type: Type.ARRAY,
      description: 'List of extracted multiple choice questions',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
              },
              required: ['answer', 'isCorrect'],
            },
          },
        },
        required: ['question', 'answers'],
      },
    };

    try {
      let contentsPayload: any[] = [];

      // STRATEGY A: For Word docs, extract text locally first (saves tokens)
      if (extension === 'docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        contentsPayload = [
          {
            text: `Extract 20 first QCMs from this text into the requested JSON format:\n\n${result.value}`,
          },
        ];
      }
      // STRATEGY B: For PDFs and Images, send the raw binary buffer natively to Gemini
      else {
        contentsPayload = [
          {
            inlineData: {
              data: file.buffer.toString('base64'),
              mimeType:
                file.mimetype === 'application/octet-stream'
                  ? extension === 'pdf'
                    ? 'application/pdf'
                    : 'image/jpeg'
                  : file.mimetype,
            },
          },
          {
            text: 'Analyze this document/exam sheet. Extract all multiple-choice questions, options, whether each option is correct (true/false based on the answer key or layout), and explanations. Handle multi-answer questions accurately.',
          },
        ];
      }

      // Call Gemini 2.5 Flash
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contentsPayload,
        config: {
          systemInstruction:
            'You are an expert academic data extractor for university pharmacy exams. Accurately map questions to their corresponding options and correct answers , do not give answers by your own only use the provided information , if no answer is provided in the document, mark it as null.',
          responseMimeType: 'application/json',
          responseSchema: qcmSchema,
          temperature: 0.1,
        },
      });

      if (!response.text) {
        throw new BadRequestException('AI returned an empty response.');
      }

      return JSON.parse(response.text);
    } catch (error: any) {
      throw new BadRequestException(
        `Native AI Extraction failed: ${error.message}`,
      );
    }
  }

  async update(id: number, updateQcmDto: UpdateQcmDto) {
    const qcm = await this.findOne(id);
    if (updateQcmDto.courseId) {
      const course = await this.dataSource.getRepository(Course).findOne({
        where: { id: updateQcmDto.courseId },
      });
      if (!course) {
        throw new NotFoundException(
          this.i18n.t('errors.course.not_found', { lang: this.currentLang }),
        );
      }
      qcm.course = course;
    }
    if (updateQcmDto.tdId) {
      const td = await this.dataSource.getRepository(Td).findOne({
        where: { id: updateQcmDto.tdId },
      });
      if (!td) {
        throw new NotFoundException(
          this.i18n.t('errors.td.not_found', { lang: this.currentLang }),
        );
      }
      qcm.td = td;
    }
    if (updateQcmDto.tpId) {
      const tp = await this.dataSource.getRepository(Tp).findOne({
        where: { id: updateQcmDto.tpId },
      });
      if (!tp) {
        throw new NotFoundException(
          this.i18n.t('errors.tp.not_found', { lang: this.currentLang }),
        );
      }
      qcm.tp = tp;
    }
    const newQcm = Object.assign(qcm, updateQcmDto);
    return await this.qcmRepository.save(newQcm);
  }

  async remove(id: number) {
    const qcm = await this.findOne(id);
    await this.qcmRepository.remove(qcm);
  }
}

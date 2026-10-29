"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { io, Socket } from "socket.io-client";
import {
  XCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Trophy,
  RotateCcw,
  Play,
  Send,
  Trash2,
} from "lucide-react";

import {
  Room,
  RoomPlayer,
  RoomQuestion,
  LeaderboardEntry,
} from "@/utils/types/room.types";
import { findRoomById } from "@/utils/server/room-api";
import { getBackendUrl, GetToken } from "@/utils/server/auth-api";

import styles from "./challenges.module.css";

interface GameRoomProps {
  roomId: string;
  onClose: () => void;
}

export default function GameRoom({ roomId, onClose }: GameRoomProps) {
  const t = useTranslations("challenges");

  const [mounted, setMounted] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const [gameState, setGameState] = useState<
    "connecting" | "waiting" | "starting" | "playing" | "completed" | "review"
  >("connecting");
  const [countdown, setCountdown] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<RoomQuestion | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<RoomPlayer[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answerProgress, setAnswerProgress] = useState<{ answered: number; total: number }>({
    answered: 0,
    total: 0,
  });
  const [reviewData, setReviewData] = useState<{
    questionIndex: number;
    questionText: string;
    userAnswers: number[];
    correctAnswers: number[];
    isCorrect: boolean;
    answersMap: Map<number, string>;
  }[]>([]);
  const [userAnswersByQuestion, setUserAnswersByQuestion] = useState<Map<number, number[]>>(new Map());

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const userAnswersByQuestionRef = useRef<Map<number, number[]>>(new Map());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionsCacheRef = useRef<Map<number, any>>(new Map());
  const hasTimeLimitRef = useRef<boolean>(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getUserId = useCallback(async () => {
    try {
      const token = await GetToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sub || payload.userId;
      }
    } catch (e) {
      console.error("Failed to get user ID from token", e);
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;
    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      const uid = await getUserId();
      if (!uid || !mounted) return;
      setUserId(uid);

      const token = await GetToken();
      const backendUrl = await getBackendUrl();

      socketInstance = io(`${backendUrl}/room`, {
        path: "/socket.io",
        auth: { token },
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on("connect", () => console.log("Connected to room socket"));
      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        if (mounted) setGameState("completed");
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      mounted = false;
      if (socketInstance) socketInstance.disconnect();
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [roomId, getUserId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const joinRoom = async () => {
      const roomRes = await findRoomById(roomId);
      if (roomRes.status && roomRes.response) {
        setRoom(roomRes.response);
        setIsHost(roomRes.response.hostId === userId);

        socket.emit("join_room", {
          roomCode: roomRes.response.code,
          userId,
          username: "User",
        });
      }
    };

    joinRoom();
  }, [socket, roomId, userId]);

  useEffect(() => {
    if (!socket) return;

    const onJoinSuccess = (data: any) => {
      setIsHost(data.isHost);
      setRoom(data.room);
      setLeaderboard(data.room.players || []);
      setGameState("waiting");
    };

    const onRoomUpdated = (data: any) => {
      setRoom(data);
      setLeaderboard(data.players || []);
    };

    const onPlayerLeft = (data: { userId: string }) => {
      console.log("Player left:", data.userId);
    };

    const onAllReady = (data: { message: string }) => {
      console.log("All players ready:", data.message);
    };

    const onGameStarting = (data: { countdown: number }) => {
      setGameState("starting");
      setCountdown(data.countdown);

      let count = data.countdown;
      countdownRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        } else {
          setCountdown(count);
        }
      }, 1000);
    };

    const onQuestion = (data: RoomQuestion) => {
      setGameState("playing");
      setCurrentQuestion(data);
      setSelectedAnswers([]);
      setAnswerSubmitted(false);
      setQuestionStartTime(Date.now());
      setTimeRemaining(data.timerSeconds);
      setAnswerProgress({ answered: 0, total: 0 });
      
      // Track if this question has a time limit
      hasTimeLimitRef.current = data.timerSeconds > 0;
      
      // Cache question data for review using ref
      questionsCacheRef.current.set(data.questionIndex, data);
    };

    const onAnswerResult = (data: any) => {
      console.log("Answer result received:", data);
      const userAnswers = userAnswersByQuestionRef.current.get(data.questionIndex) || [];
      
      // Create a map of answer ID to answer text from backend response
      const answersMap = new Map<number, string>();
      if (data.allAnswers) {
        console.log("All answers from backend:", data.allAnswers);
        data.allAnswers.forEach((answer: any) => {
          answersMap.set(answer.id, answer.answer);
        });
      } else {
        console.warn("No allAnswers in backend response, using cache");
        const questionData = questionsCacheRef.current.get(data.questionIndex);
        if (questionData?.qcm?.answers) {
          questionData.qcm.answers.forEach((answer: any) => {
            answersMap.set(answer.id, answer.answer);
          });
        }
      }
      
      console.log("Answers map created:", answersMap);
      
      setReviewData((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.questionIndex === data.questionIndex
        );
        const newReviewItem = {
          questionIndex: data.questionIndex,
          questionText: data.questionText || '',
          userAnswers,
          correctAnswers: data.correctAnswerIds,
          isCorrect: data.isCorrect,
          answersMap,
        };
        
        console.log("New review item:", newReviewItem);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newReviewItem;
          return updated;
        }
        return [...prev, newReviewItem];
      });
    };

    const onLeaderboardUpdate = (data: RoomPlayer[]) => {
      setLeaderboard(data);
    };

    const onAnswerProgress = (data: { answered: number; total: number }) => {
      setAnswerProgress(data);
    };

    const onTimeUp = (data: { questionIndex: number }) => {
      console.log("Time up for question:", data.questionIndex);
      // Backend time_up event - just ensure timer is cleared and submitted
      setAnswerSubmitted(true);
      setTimeRemaining(0);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };

    const onGameOver = (data: { leaderboard: LeaderboardEntry[] }) => {
      setGameState("review");
      setFinalLeaderboard(data.leaderboard);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      // Log cached questions for debugging
      console.log("Cached questions:", questionsCacheRef.current);
      console.log("Review data before game over:", reviewData);
    };

    const onRoomDeleted = (data: { reason?: string }) => {
      alert(data?.reason || "Room was closed by the host");
      onCloseRef.current();
    };

    const onRematchStarted = (data: { room: any }) => {
      setRoom(data.room);
      setLeaderboard(data.room.players || []);
      setGameState("waiting");
      setCurrentQuestion(null);
      setSelectedAnswers([]);
      setAnswerSubmitted(false);
      setFinalLeaderboard([]);
      setAnswerProgress({ answered: 0, total: 0 });
      setCountdown(0);
      setTimeRemaining(0);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };

    const onError = (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(data.message);
    };

    socket.on("join_success", onJoinSuccess);
    socket.on("room_updated", onRoomUpdated);
    socket.on("player_left", onPlayerLeft);
    socket.on("all_ready", onAllReady);
    socket.on("game_starting", onGameStarting);
    socket.on("question", onQuestion);
    socket.on("answer_result", onAnswerResult);
    socket.on("leaderboard_update", onLeaderboardUpdate);
    socket.on("answer_progress", onAnswerProgress);
    socket.on("time_up", onTimeUp);
    socket.on("game_over", onGameOver);
    socket.on("room_deleted", onRoomDeleted);
    socket.on("rematch_started", onRematchStarted);
    socket.on("error", onError);

    return () => {
      socket.off("join_success", onJoinSuccess);
      socket.off("room_updated", onRoomUpdated);
      socket.off("player_left", onPlayerLeft);
      socket.off("all_ready", onAllReady);
      socket.off("game_starting", onGameStarting);
      socket.off("question", onQuestion);
      socket.off("answer_result", onAnswerResult);
      socket.off("leaderboard_update", onLeaderboardUpdate);
      socket.off("answer_progress", onAnswerProgress);
      socket.off("time_up", onTimeUp);
      socket.off("game_over", onGameOver);
      socket.off("room_deleted", onRoomDeleted);
      socket.off("rematch_started", onRematchStarted);
      socket.off("error", onError);
    };
  }, [socket]);

  // Timer countdown effect
  useEffect(() => {
    // Only start timer if there's a time limit
    if (hasTimeLimitRef.current && gameState === "playing" && !answerSubmitted) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Timer reached 0
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            // Mark as submitted immediately when time runs out
            setAnswerSubmitted(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, answerSubmitted]); // Removed timeRemaining from dependencies

  const handleReady = () => {
    if (!socket || !userId) return;
    socket.emit("player_ready", { roomId, userId });
  };

  const handleStartGame = () => {
    if (!socket || !userId) return;
    socket.emit("start_game", { roomId, userId });
  };

  const handleSubmitAnswer = () => {
    if (!socket || !userId || !currentQuestion) return;
    if (selectedAnswers.length === 0) {
      alert(t("selectAtLeastOne"));
      return;
    }

    const timeSpent = Date.now() - questionStartTime;
    
    // Store user answers for review
    userAnswersByQuestionRef.current.set(currentQuestion.questionIndex, [...selectedAnswers]);
    setUserAnswersByQuestion(new Map(userAnswersByQuestionRef.current));

    socket.emit("submit_answer", {
      roomId,
      userId,
      questionIndex: currentQuestion.questionIndex,
      selectedAnswerIds: selectedAnswers,
      timeSpentMs: timeSpent,
    });

    setAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!socket || !userId) return;
    socket.emit("next_question", { roomId, userId });
  };

  const handleLeaveRoom = () => {
    if (socket && userId) {
      socket.emit("leave_room", { roomId, userId });
    }
    onClose();
  };

  // Rematch: reset the same room in place, no new room
  const handleRematch = () => {
    if (!socket || !userId) return;
    socket.emit("rematch", { roomId, userId });
  };

  const handleNewChallenge = () => {
    onClose();
    window.location.href = "/dashboard/challenges";
  };

  const toggleAnswer = (answerId: number) => {
    if (answerSubmitted) return;
    setSelectedAnswers((prev) =>
      prev.includes(answerId)
        ? prev.filter((id) => id !== answerId)
        : [...prev, answerId],
    );
  };

  return (
    <div className={styles.gameRoom}>
      <div className={styles.gameRoomHeader}>
        <div>
          <h2>
            {gameState === "completed"
              ? t("gameComplete")
              : gameState === "playing"
                ? t("gameInProgress")
                : t("waitingRoom")}
          </h2>
          {room && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
              {t("roomCode")}: <strong>{room.code}</strong>
            </p>
          )}
        </div>
        <button className={styles.closeBtn} onClick={handleLeaveRoom}>
          <XCircle size={18} />
        </button>
      </div>

      <div className={styles.gameRoomContent}>
        {!mounted && (
          <div className={styles.loading}>
            <Loader2 size={32} className={styles.spinner} />
            <p>{t("connecting")}</p>
          </div>
        )}

        {mounted && gameState === "connecting" && (
          <div className={styles.loading}>
            <Loader2 size={32} className={styles.spinner} />
            <p>{t("connecting")}</p>
          </div>
        )}

        {mounted && gameState === "waiting" && (
          <WaitingRoom
            room={room}
            leaderboard={leaderboard}
            isHost={isHost}
            userId={userId}
            onReady={handleReady}
            onStartGame={handleStartGame}
          />
        )}

        {mounted && gameState === "starting" && (
          <div className={styles.countdownContainer}>
            <div className={styles.countdownNumber}>{countdown}</div>
            <p>{t("gameStarting")}</p>
          </div>
        )}

        {mounted && gameState === "playing" && currentQuestion && (
          <QuestionView
            question={currentQuestion}
            selectedAnswers={selectedAnswers}
            answerSubmitted={answerSubmitted}
            timeRemaining={timeRemaining}
            hasTimeLimit={hasTimeLimitRef.current}
            isHost={isHost}
            answerProgress={answerProgress}
            onToggleAnswer={toggleAnswer}
            onSubmitAnswer={handleSubmitAnswer}
            onNextQuestion={handleNextQuestion}
            leaderboard={leaderboard}
          />
        )}

        {mounted && gameState === "completed" && (
          <GameCompleted
            leaderboard={finalLeaderboard}
            isHost={isHost}
            onRematch={handleRematch}
            onNewChallenge={handleNewChallenge}
            onLeave={handleLeaveRoom}
            onDeleteRoom={handleLeaveRoom}
          />
        )}

        {mounted && gameState === "review" && (
          <GameReview
            reviewData={reviewData}
            finalLeaderboard={finalLeaderboard}
            onProceedToCompleted={() => setGameState("completed")}
            isHost={isHost}
            onRematch={handleRematch}
            onNewChallenge={handleNewChallenge}
            onLeave={handleLeaveRoom}
            onDeleteRoom={handleLeaveRoom}
          />
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Waiting Room Component
// ===========================================================================

function WaitingRoom({
  room,
  leaderboard,
  isHost,
  userId,
  onReady,
  onStartGame,
}: {
  room: Room | null;
  leaderboard: RoomPlayer[];
  isHost: boolean;
  userId: string | null;
  onReady: () => void;
  onStartGame: () => void;
}) {
  const t = useTranslations("challenges");

  const currentPlayer = leaderboard.find((p) => p.userId === userId);
  const nonHostPlayers = leaderboard.filter((p) => !p.isHost);
  const allReady =
    nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);

  return (
    <div className={styles.waitingRoom}>
      <div className={styles.waitingRoomLeft}>
        <h3>{t("players")}</h3>
        <div className={styles.playerList}>
          {leaderboard.map((player) => (
            <div
              key={player.id}
              className={`${styles.playerItem} ${player.isHost ? styles.playerHost : ""
                }`}
            >
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>
                  {player.username}
                  {player.isHost && (
                    <span className={styles.hostBadge}>{t("host")}</span>
                  )}
                </span>
                {player.isReady && (
                  <CheckCircle2 size={16} className={styles.readyIcon} />
                )}
              </div>
            </div>
          ))}
        </div>

        {currentPlayer && !currentPlayer.isHost && (
          <button
            className={`${styles.readyButton} ${currentPlayer.isReady ? styles.readyButtonReady : ""
              }`}
            onClick={onReady}
            disabled={currentPlayer.isReady}
          >
            {currentPlayer.isReady ? (
              <>
                <CheckCircle2 size={16} />
                {t("ready")}
              </>
            ) : (
              t("markReady")
            )}
          </button>
        )}
      </div>

      <div className={styles.waitingRoomRight}>
        <div className={styles.roomInfo}>
          <h3>{t("roomSettings")}</h3>
          <div className={styles.settingItem}>
            <span>{t("qcmCount")}:</span>
            <strong>{room?.qcmCount}</strong>
          </div>
          <div className={styles.settingItem}>
            <span>{t("timerSeconds")}:</span>
            <strong>{room?.timerSeconds}s</strong>
          </div>
        </div>

        {isHost && (
          <button
            className={styles.startGameButton}
            onClick={onStartGame}
            disabled={!allReady}
          >
            <Play size={16} />
            {t("startGame")}
          </button>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Question View Component
// ===========================================================================

function QuestionView({
  question,
  selectedAnswers,
  answerSubmitted,
  timeRemaining,
  hasTimeLimit,
  isHost,
  answerProgress,
  onToggleAnswer,
  onSubmitAnswer,
  onNextQuestion,
  leaderboard,
}: {
  question: RoomQuestion;
  selectedAnswers: number[];
  answerSubmitted: boolean;
  timeRemaining: number;
  hasTimeLimit: boolean;
  isHost: boolean;
  answerProgress: { answered: number; total: number };
  onToggleAnswer: (id: number) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  leaderboard: RoomPlayer[];
}) {
  const t = useTranslations("challenges");

  const allAnswered =
    answerProgress.total > 0 && answerProgress.answered >= answerProgress.total;

  return (
    <div className={styles.questionView}>
      <div className={styles.questionMain}>
        <div className={styles.questionHeader}>
          <div className={styles.questionProgress}>
            <span>
              {t("question")} {question.questionIndex + 1} /{" "}
              {question.totalQuestions}
            </span>
            {timeRemaining > 0 && (
              <div className={styles.timer}>
                <Clock size={16} />
                {timeRemaining}s
              </div>
            )}
          </div>
        </div>

        <div className={styles.questionContent}>
          <h3 className={styles.questionText}>{question.qcm.question}</h3>

          {question.qcm.image && (
            <img
              src={question.qcm.image.url}
              alt="Question image"
              className={styles.questionImage}
            />
          )}

          <div className={styles.answersList}>
            {question.qcm.answers.map((answer) => (
              <button
                key={answer.id}
                className={`${styles.answerOption} ${selectedAnswers.includes(answer.id) ? styles.answerSelected : ""
                  } ${answerSubmitted ? styles.answerDisabled : ""}`}
                onClick={() => onToggleAnswer(answer.id)}
                disabled={answerSubmitted}
              >
                <div className={styles.answerRadio}>
                  {selectedAnswers.includes(answer.id) && (
                    <div className={styles.answerRadioDot} />
                  )}
                </div>
                <span>{answer.answer}</span>
              </button>
            ))}
          </div>

          {!answerSubmitted && (
            <button className={styles.submitButton} onClick={onSubmitAnswer}>
              <Send size={16} />
              {t("submitAnswer")}
            </button>
          )}

          {answerSubmitted && isHost && (
            <>
              <button
                className={styles.nextButton}
                onClick={onNextQuestion}
              >
                {t("nextQuestion")} →
              </button>
              {!allAnswered && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: hasTimeLimit && timeRemaining === 0 ? "var(--accent)" : "var(--muted-foreground)",
                    marginTop: "0.5rem",
                  }}
                >
                  {hasTimeLimit && timeRemaining === 0
                    ? "Time's up! Some players didn't answer."
                    : `Waiting for players… ${answerProgress.answered} / ${answerProgress.total}`}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.questionSidebar}>
        <h4>{t("leaderboard")}</h4>
        <div className={styles.leaderboardList}>
          {[...leaderboard]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className={styles.leaderboardItem}>
                <span className={styles.leaderboardRank}>#{index + 1}</span>
                <span className={styles.leaderboardName}>{player.username}</span>
                <span className={styles.leaderboardScore}>{player.score}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Game Completed Component
// ===========================================================================

function GameCompleted({
  leaderboard,
  isHost,
  onRematch,
  onNewChallenge,
  onLeave,
  onDeleteRoom,
}: {
  leaderboard: LeaderboardEntry[];
  isHost: boolean;
  onRematch: () => void;
  onNewChallenge: () => void;
  onLeave: () => void;
  onDeleteRoom: () => void;
}) {
  const t = useTranslations("challenges");

  return (
    <div className={styles.gameCompleted}>
      <div className={styles.gameCompletedHeader}>
        <Trophy size={48} className={styles.trophyIcon} />
        <h2>{t("gameComplete")}</h2>
        <p>{t("gameCompleteSubtitle")}</p>
      </div>

      <div className={styles.finalLeaderboard}>
        <h3>{t("finalLeaderboard")}</h3>
        <div className={styles.leaderboardTable}>
          {leaderboard.map((entry) => (
            <div key={entry.userId} className={styles.leaderboardRow}>
              <div className={styles.leaderboardRank}>
                {entry.rank === 1 && "🥇"}
                {entry.rank === 2 && "🥈"}
                {entry.rank === 3 && "🥉"}
                {entry.rank > 3 && `#${entry.rank}`}
              </div>
              <div className={styles.leaderboardPlayerInfo}>
                <div className={styles.leaderboardName}>{entry.username}</div>
                <div className={styles.leaderboardStats}>
                  {entry.correctAnswersCount} {t("correct")}
                </div>
              </div>
              <div className={styles.leaderboardScore}>{entry.score} pts</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gameCompletedActions}>
        {isHost && (
          <button className={styles.rematchButton} onClick={onRematch}>
            <RotateCcw size={16} />
            {t("rematch")}
          </button>
        )}
        <button className={styles.newChallengeButton} onClick={onNewChallenge}>
          <Play size={16} />
          {t("newChallenge")}
        </button>
        <button className={styles.leaveButton} onClick={onLeave}>
          {t("leave")}
        </button>
        {isHost && (
          <button className={styles.deleteRoomButton} onClick={onDeleteRoom}>
            <Trash2 size={16} />
            {t("deleteRoom")}
          </button>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Game Review Component
// ===========================================================================

function GameReview({
  reviewData,
  finalLeaderboard,
  onProceedToCompleted,
  isHost,
  onRematch,
  onNewChallenge,
  onLeave,
  onDeleteRoom,
}: {
  reviewData: {
    questionIndex: number;
    questionText: string;
    userAnswers: number[];
    correctAnswers: number[];
    isCorrect: boolean;
    answersMap: Map<number, string>;
  }[];
  finalLeaderboard: LeaderboardEntry[];
  onProceedToCompleted: () => void;
  isHost: boolean;
  onRematch: () => void;
  onNewChallenge: () => void;
  onLeave: () => void;
  onDeleteRoom: () => void;
}) {
  const t = useTranslations("challenges");

  return (
    <div className={styles.gameReview}>
      <div className={styles.gameReviewHeader}>
        <Trophy size={48} className={styles.trophyIcon} />
        <h2>{t("reviewAnswers")}</h2>
        <p>{t("reviewAnswersSubtitle")}</p>
      </div>

      <div className={styles.reviewList}>
        {reviewData.map((review, index) => (
          <div
            key={index}
            className={`${styles.reviewItem} ${review.isCorrect ? styles.reviewCorrect : styles.reviewIncorrect
              }`}
          >
            <div className={styles.reviewItemHeader}>
              <span className={styles.reviewQuestionNumber}>
                {t("question")} {review.questionIndex + 1}
              </span>
              <span className={styles.reviewResult}>
                {review.isCorrect ? (
                  <>
                    <CheckCircle2 size={16} />
                    {t("correct")}
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    {t("incorrect")}
                  </>
                )}
              </span>
            </div>

            <div className={styles.reviewItemContent}>
              <div className={styles.reviewQuestionText}>
                {review.questionText}
              </div>
              <div className={styles.reviewAnswers}>
                <div className={styles.reviewAnswerSection}>
                  <span className={styles.reviewAnswerLabel}>{t("yourAnswers")}:</span>
                  <div className={styles.reviewAnswerTags}>
                    {review.userAnswers.map((answerId) => (
                      <span key={answerId} className={styles.reviewAnswerTag}>
                        {review.answersMap.get(answerId) || `#${answerId}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.reviewAnswerSection}>
                  <span className={styles.reviewAnswerLabel}>{t("correctAnswers")}:</span>
                  <div className={styles.reviewAnswerTags}>
                    {review.correctAnswers.map((answerId) => (
                      <span key={answerId} className={styles.reviewAnswerTag}>
                        {review.answersMap.get(answerId) || `#${answerId}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.gameCompletedActions}>
        <button className={styles.proceedButton} onClick={onProceedToCompleted}>
          {t("viewLeaderboard")}
        </button>
        {isHost && (
          <button className={styles.rematchButton} onClick={onRematch}>
            <RotateCcw size={16} />
            {t("rematch")}
          </button>
        )}
        <button className={styles.newChallengeButton} onClick={onNewChallenge}>
          <Play size={16} />
          {t("newChallenge")}
        </button>
        <button className={styles.leaveButton} onClick={onLeave}>
          {t("leave")}
        </button>
        {isHost && (
          <button className={styles.deleteRoomButton} onClick={onDeleteRoom}>
            <Trash2 size={16} />
            {t("deleteRoom")}
          </button>
        )}
      </div>
    </div>
  );
}
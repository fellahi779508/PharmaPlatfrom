import { Course } from "./course.types"
import { Mindmap } from "./mindmap.types"

export type Summary = {
    id: number
    text: string
    course: Course
    mindmap: Mindmap
}
export type CreateSummary = {
    text: string
    courseId: number
}
export type UpdateSummary = Partial<CreateSummary>
import { Summary } from "./summary.types"

export type Mindmap = {
    id: number
    name: string
    jsonContent: JSON
    summary: Summary
}
export type CreateMindmap = {
    name: string
    jsonContent: JSON
    summaryId: number
}
export type UpdateMindmap = Partial<CreateMindmap>

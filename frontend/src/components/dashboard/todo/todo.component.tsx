"use client";

import { useEffect, useState, type PointerEvent } from "react";
import {
  Plus,
  Loader2,
  CheckSquare2,
  ListTodo,
  X,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Calendar,
  Clock,
  Flag,
} from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  getTodoListsOfUser,
  createTodo,
  deleteTodo,
} from "@/utils/server/todo-api";
import {
  getTasksByTodoId,
  createTask,
  deleteTask,
  updateTask,
} from "@/utils/server/task-api";
import { Todo, CreateTodo } from "@/utils/types/todo.types";
import { CreateTask } from "@/utils/types/task.types";
import styles from "./todo.module.css";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type Priority = "low" | "medium" | "high";

const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high"];

const emptyTask = (todoId = 0): CreateTask => ({
  title: "",
  description: "",
  todoId,
  isFinished: false,
  priority: "medium",
  startDate: "",
  startTime: "",
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TodoPageComponent() {
  const t = useTranslations("Todo");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [taskData, setTaskData] = useState<CreateTask>(emptyTask());
  const [formData, setFormData] = useState<CreateTodo>({
    title: "",
    description: "",
    status: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  /* ------------------------- Data ------------------------- */

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await getTodoListsOfUser();
      if (response.status) setTodos(response.response);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async (todoId: number) => {
    const res = await getTasksByTodoId(todoId);
    if (res.status) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? { ...todo, tasks: res.response } : todo,
        ),
      );
    }
  };

  /* ------------------------- Todo handlers ------------------------- */

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await createTodo(formData);
      if (response.status) {
        setShowModal(false);
        setFormData({ title: "", description: "", status: false });
        await fetchTodos();
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteTodo = async () => {
    if (!todoToDelete) return;
    try {
      setDeleting(true);
      const res = await deleteTodo(todoToDelete.id);
      if (res.status) {
        setTodos((prev) => prev.filter((t) => t.id !== todoToDelete.id));
        if (expandedTodoId === todoToDelete.id) setExpandedTodoId(null);
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    } finally {
      setDeleting(false);
      setTodoToDelete(null);
    }
  };

  const handleOpenDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    todo: Todo,
  ) => {
    e.stopPropagation();
    setTodoToDelete(todo);
  };

  /* ------------------------- Todo expand ------------------------- */

  const handleTodoClick = async (todoId: number) => {
    if (expandedTodoId === todoId) {
      setExpandedTodoId(null);
      return;
    }
    setExpandedTodoId(todoId);
    try {
      await refreshTasks(todoId);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  /* ------------------------- Task handlers ------------------------- */

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTodoId) return;

    try {
      setTaskSubmitting(true);
      const payload: CreateTask = {
        title: taskData.title,
        description: taskData.description || undefined,
        todoId: selectedTodoId,
        isFinished: false,
        priority: taskData.priority || undefined,
        startDate: taskData.startDate || undefined,
        startTime: taskData.startTime || undefined,
      };
      const response = await createTask(payload);
      if (response.status) {
        setShowTaskModal(false);
        setTaskData(emptyTask());
        await refreshTasks(selectedTodoId);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: boolean) => {
    try {
      const response = await updateTask(taskId, { isFinished: !currentStatus });
      if (response.status && expandedTodoId) {
        await refreshTasks(expandedTodoId);
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await deleteTask(taskId);
      if (response.status && expandedTodoId) {
        await refreshTasks(expandedTodoId);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleOpenTaskModal = (todoId: number) => {
    setSelectedTodoId(todoId);
    setTaskData(emptyTask(todoId));
    setShowTaskModal(true);
  };

  /* ------------------------- Tilt effect ------------------------- */

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;

    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);

    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3;

    el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${rect.width / 2}px`);
    el.style.setProperty("--my", `${rect.height / 2}px`);
  };

  /* ------------------------- Derived ------------------------- */

  const calculateProgress = (todo: Todo) => {
    if (!todo.tasks || todo.tasks.length === 0) return 0;
    const completed = todo.tasks.filter((task: any) => task.isFinished).length;
    return Math.round((completed / todo.tasks.length) * 100);
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const priorityLabel = (p?: string) => {
    if (!p) return null;
    return t(`priority.${p}` as any);
  };

  const priorityClass = (p?: string) => {
    if (p === "high") return styles.priorityHigh;
    if (p === "low") return styles.priorityLow;
    return styles.priorityMedium;
  };

  /* ------------------------- Render ------------------------- */

  return (
    <main className={styles.page}>
      <div className={styles.contentWrapper}>
        {/* Header */}
        <motion.header
          className={styles.header}
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className={styles.badge}>
            <ListTodo size={13} />
            {t("badge")}
          </span>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </motion.header>

        {/* Action Bar */}
        <div className={styles.actionBar}>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={styles.addButton}
          >
            <Plus size={18} />
            {t("createButton")}
          </button>
        </div>

        {/* Todo Grid */}
        {loading ? (
          <div className={styles.loading}>
            <Loader2 size={32} className={styles.spinner} />
          </div>
        ) : todos.length === 0 ? (
          <div className={styles.emptyState}>
            <ListTodo size={64} className={styles.emptyStateIcon} />
            <h2 className={styles.emptyStateTitle}>{t("empty.title")}</h2>
            <p className={styles.emptyStateText}>{t("empty.text")}</p>
          </div>
        ) : (
          <motion.div
            className={styles.todoGrid}
            initial={
              shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }
            }
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          >
            {todos.map((todo) => {
              const progress = calculateProgress(todo);
              const taskCount = todo.tasks?.length || 0;
              const completedCount =
                todo.tasks?.filter((x: any) => x.isFinished).length || 0;
              const isExpanded = expandedTodoId === todo.id;

              return (
                <div key={todo.id} className={styles.todoWrapper}>
                  <div
                    className={`${styles.todoCard} ${isExpanded ? styles.todoCardExpanded : ""
                      }`}
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handlePointerLeave}
                    onClick={() => handleTodoClick(todo.id)}
                  >
                    <div className={styles.todoCardHeader}>
                      <div className={styles.todoIcon}>
                        <CheckSquare2 size={20} strokeWidth={2.2} />
                      </div>

                      <div className={styles.cardHeaderActions}>
                        <button
                          type="button"
                          className={styles.deleteTodoButton}
                          onClick={(e) => handleOpenDelete(e, todo)}
                          title={t("deleteTooltip")}
                          aria-label={t("deleteTooltip")}
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronRight
                          size={20}
                          className={`${styles.chevron} ${isExpanded ? styles.chevronRotated : ""
                            }`}
                        />
                      </div>
                    </div>

                    <h3 className={styles.todoCardTitle}>{todo.title}</h3>
                    <p className={styles.todoCardDescription}>
                      {todo.description}
                    </p>

                    <div className={styles.todoCardFooter}>
                      <div className={styles.progressContainer}>
                        <div className={styles.progressLabel}>
                          <span>{t("card.progress")}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className={styles.taskCount}>
                        <CheckSquare2 size={14} />
                        <span>
                          {completedCount} {t("card.of")} {taskCount}{" "}
                          {t("card.tasksCompleted")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={styles.tasksSection}
                      >
                        <div className={styles.tasksHeader}>
                          <h4>{t("tasks.title")}</h4>
                          <button
                            type="button"
                            onClick={() => handleOpenTaskModal(todo.id)}
                            className={styles.addTaskButton}
                          >
                            <Plus size={16} />
                            {t("tasks.addTask")}
                          </button>
                        </div>

                        {todo.tasks && todo.tasks.length > 0 ? (
                          <div className={styles.tasksList}>
                            {todo.tasks.map((task: any) => {
                              const dateLabel = formatDate(task.startDate);
                              const hasMeta =
                                task.priority || dateLabel || task.startTime;

                              return (
                                <div key={task.id} className={styles.taskItem}>
                                  <div className={styles.taskCheckbox}>
                                    <input
                                      type="checkbox"
                                      checked={task.isFinished}
                                      onChange={() =>
                                        handleToggleTask(
                                          task.id,
                                          task.isFinished,
                                        )
                                      }
                                      className={styles.taskInput}
                                    />
                                  </div>
                                  <div className={styles.taskContent}>
                                    <span
                                      className={`${styles.taskTitle} ${task.isFinished
                                          ? styles.taskCompleted
                                          : ""
                                        }`}
                                    >
                                      {task.title}
                                    </span>
                                    {task.description && (
                                      <span
                                        className={styles.taskDescription}
                                      >
                                        {task.description}
                                      </span>
                                    )}

                                    {hasMeta && (
                                      <div className={styles.taskMeta}>
                                        {task.priority && (
                                          <span
                                            className={`${styles.priorityBadge} ${priorityClass(
                                              task.priority,
                                            )}`}
                                          >
                                            <Flag size={10} />
                                            {priorityLabel(task.priority)}
                                          </span>
                                        )}
                                        {dateLabel && (
                                          <span className={styles.taskMetaChip}>
                                            <Calendar size={11} />
                                            {dateLabel}
                                          </span>
                                        )}
                                        {task.startTime && (
                                          <span className={styles.taskMetaChip}>
                                            <Clock size={11} />
                                            {task.startTime}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className={styles.deleteTaskButton}
                                    aria-label={t("tasks.delete")}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={styles.tasksEmpty}>
                            {t("tasks.empty")}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create Todo Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <motion.div
            className={styles.modal}
            initial={
              shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }
            }
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{t("modal.title")}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTodo}>
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.formLabel}>
                  {t("modal.titleLabel")}
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={styles.formInput}
                  placeholder={t("modal.titlePlaceholder")}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.formLabel}>
                  {t("modal.descriptionLabel")}
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={styles.formTextarea}
                  placeholder={t("modal.descriptionPlaceholder")}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitButton}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      {t("modal.submitting")}
                    </>
                  ) : (
                    t("modal.submit")
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className={styles.modalOverlay}>
          <motion.div
            className={styles.modal}
            initial={
              shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }
            }
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{t("tasks.modal.title")}</h2>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className={styles.formGroup}>
                <label htmlFor="taskTitle" className={styles.formLabel}>
                  {t("tasks.modal.titleLabel")}
                </label>
                <input
                  type="text"
                  id="taskTitle"
                  value={taskData.title}
                  onChange={(e) =>
                    setTaskData({ ...taskData, title: e.target.value })
                  }
                  className={styles.formInput}
                  placeholder={t("tasks.modal.titlePlaceholder")}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="taskDescription" className={styles.formLabel}>
                  {t("tasks.modal.descriptionLabel")}
                </label>
                <textarea
                  id="taskDescription"
                  value={taskData.description}
                  onChange={(e) =>
                    setTaskData({ ...taskData, description: e.target.value })
                  }
                  className={styles.formTextarea}
                  placeholder={t("tasks.modal.descriptionPlaceholder")}
                />
              </div>

              {/* Priority */}
              <div className={styles.formGroup}>
                <label htmlFor="taskPriority" className={styles.formLabel}>
                  {t("tasks.modal.priorityLabel")}
                </label>
                <select
                  id="taskPriority"
                  className={styles.formSelect}
                  value={taskData.priority ?? "medium"}
                  onChange={(e) =>
                    setTaskData({ ...taskData, priority: e.target.value })
                  }
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {t(`priority.${p}` as any)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + time side by side */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="taskDate" className={styles.formLabel}>
                    {t("tasks.modal.startDateLabel")}
                  </label>
                  <input
                    type="date"
                    id="taskDate"
                    className={styles.formInput}
                    value={taskData.startDate ?? ""}
                    onChange={(e) =>
                      setTaskData({ ...taskData, startDate: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="taskTime" className={styles.formLabel}>
                    {t("tasks.modal.startTimeLabel")}
                  </label>
                  <input
                    type="time"
                    id="taskTime"
                    className={styles.formInput}
                    value={taskData.startTime ?? ""}
                    onChange={(e) =>
                      setTaskData({ ...taskData, startTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className={styles.cancelButton}
                >
                  {t("tasks.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className={styles.submitButton}
                >
                  {taskSubmitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      {t("tasks.modal.submitting")}
                    </>
                  ) : (
                    t("tasks.modal.submit")
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Todo Confirmation */}
      <AnimatePresence>
        {todoToDelete && (
          <div
            className={styles.modalOverlay}
            onClick={() => !deleting && setTodoToDelete(null)}
          >
            <motion.div
              className={styles.confirmModal}
              initial={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 0, scale: 0.95 }
              }
              animate={
                shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
              }
              exit={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 0, scale: 0.95 }
              }
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>
                <AlertTriangle size={26} />
              </div>
              <h3 className={styles.confirmTitle}>
                {t("deleteModal.title")}
              </h3>
              <p className={styles.confirmText}>
                {t("deleteModal.text", { title: todoToDelete.title })}
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setTodoToDelete(null)}
                  disabled={deleting}
                >
                  {t("deleteModal.cancel")}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={handleConfirmDeleteTodo}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      {t("deleteModal.deleting")}
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      {t("deleteModal.confirm")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
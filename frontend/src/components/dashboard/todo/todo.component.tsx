"use client";

import { useEffect, useState, type PointerEvent } from "react";
import {
  Plus,
  Loader2,
  CheckSquare2,
  ListTodo,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { getTodoListsOfUser, createTodo } from "@/utils/server/todo-api";
import {
  getTasksByTodoId,
  createTask,
  updateTask,
  deleteTask,
} from "@/utils/server/task-api";
import { Todo, CreateTodo } from "@/utils/types/todo.types";
import { CreateTask, UpdateTask } from "@/utils/types/task.types";
import styles from "./todo.module.css";

export default function TodoPageComponent() {
  const t = useTranslations("Todo");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [taskData, setTaskData] = useState<CreateTask>({
    title: "",
    description: "",
    todoId: 0,
    isFinished: false,
  });
  const [formData, setFormData] = useState<CreateTodo>({
    title: "",
    description: "",
    status: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await getTodoListsOfUser();
      if (response.status) {
        setTodos(response.response);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const calculateProgress = (todo: Todo) => {
    if (!todo.tasks || todo.tasks.length === 0) return 0;
    const completedTasks = todo.tasks.filter(
      (task: any) => task.isFinished,
    ).length;
    return Math.round((completedTasks / todo.tasks.length) * 100);
  };

  const handleTodoClick = async (todoId: number) => {
    if (expandedTodoId === todoId) {
      setExpandedTodoId(null);
    } else {
      setExpandedTodoId(todoId);
      // Fetch tasks for this todo
      try {
        const response = await getTasksByTodoId(todoId);
        if (response.status) {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === todoId ? { ...todo, tasks: response.response } : todo,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTodoId) return;

    try {
      setTaskSubmitting(true);
      const response = await createTask({
        ...taskData,
        todoId: selectedTodoId,
      });
      if (response.status) {
        setShowTaskModal(false);
        setTaskData({
          title: "",
          description: "",
          todoId: 0,
          isFinished: false,
        });
        // Refresh tasks for the expanded todo
        if (expandedTodoId) {
          const tasksResponse = await getTasksByTodoId(expandedTodoId);
          if (tasksResponse.status) {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === expandedTodoId
                  ? { ...todo, tasks: tasksResponse.response }
                  : todo,
              ),
            );
          }
        }
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
      if (response.status) {
        // Refresh tasks for the expanded todo
        if (expandedTodoId) {
          const tasksResponse = await getTasksByTodoId(expandedTodoId);
          if (tasksResponse.status) {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === expandedTodoId
                  ? { ...todo, tasks: tasksResponse.response }
                  : todo,
              ),
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await deleteTask(taskId);
      if (response.status) {
        // Refresh tasks for the expanded todo
        if (expandedTodoId) {
          const tasksResponse = await getTasksByTodoId(expandedTodoId);
          if (tasksResponse.status) {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === expandedTodoId
                  ? { ...todo, tasks: tasksResponse.response }
                  : todo,
              ),
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleOpenTaskModal = (todoId: number) => {
    setSelectedTodoId(todoId);
    setTaskData({ title: "", description: "", todoId, isFinished: false });
    setShowTaskModal(true);
  };

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
                todo.tasks?.filter((t: any) => t.isFinished).length || 0;

              return (
                <div key={todo.id} className={styles.todoWrapper}>
                  <div
                    className={`${styles.todoCard} ${
                      expandedTodoId === todo.id ? styles.todoCardExpanded : ""
                    }`}
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handlePointerLeave}
                    onClick={() => handleTodoClick(todo.id)}
                  >
                    <div className={styles.todoCardHeader}>
                      <div className={styles.todoIcon}>
                        <CheckSquare2 size={20} strokeWidth={2.2} />
                      </div>
                      <ChevronRight
                        size={20}
                        className={`${styles.chevron} ${
                          expandedTodoId === todo.id
                            ? styles.chevronRotated
                            : ""
                        }`}
                      />
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
                    {expandedTodoId === todo.id && (
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
                            {todo.tasks.map((task: any) => (
                              <div key={task.id} className={styles.taskItem}>
                                <div className={styles.taskCheckbox}>
                                  <input
                                    type="checkbox"
                                    checked={task.isFinished}
                                    onChange={() =>
                                      handleToggleTask(task.id, task.isFinished)
                                    }
                                    className={styles.taskInput}
                                  />
                                </div>
                                <div className={styles.taskContent}>
                                  <span
                                    className={`${styles.taskTitle} ${
                                      task.isFinished
                                        ? styles.taskCompleted
                                        : ""
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  {task.description && (
                                    <span className={styles.taskDescription}>
                                      {task.description}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className={styles.deleteTaskButton}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
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
    </main>
  );
}

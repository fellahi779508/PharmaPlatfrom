"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Key,
  Shield,
  GraduationCap,
  RefreshCw,
  Search,
  Calendar,
  Clock,
  Check,
  Loader2,
  Save,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import {
  createUser,
  deleteRedeemCode,
  deleteUser,
  getAllRedeemCodes,
  getAllUsers,
  getRedeemCodeById,
  getUserById,
  postRedeemCode,
  updateRedeemCode,
  updateUser,
} from "@/utils/server/admin-api";
import { getYears } from "@/utils/server/year-api";

import styles from "./admin.module.css";
import {
  CreateRedeemCode,
  CreateUser,
  RedeemCode,
  UpdateRedeemCode,
  UpdateUser,
  User,
  Year,
} from "@/utils/types/allTypes";
import page from "@/app/[locale]/page";

/* ------------------------------------------------------------------ */
/* Response normalizer — plain arrays                                  */
/* ------------------------------------------------------------------ */

const extractArray = <T,>(root: any, label = "response"): T[] => {
  const seen = new WeakSet<object>();

  const walk = (node: any, depth: number): T[] | null => {
    if (depth > 6 || node == null) return null;

    if (Array.isArray(node)) {
      if (node.length === 0) return node as T[];
      const first = node[0];
      return first != null && typeof first === "object"
        ? (node as T[])
        : null;
    }

    if (typeof node !== "object") return null;
    if (seen.has(node as object)) return null;
    seen.add(node as object);

    const priority = [
      "users",
      "redeemCodes",
      "codes",
      "years",
      "items",
      "data",
      "results",
      "rows",
      "list",
      "records",
      "response",
    ];
    const allKeys = Object.keys(node);
    const ordered = [
      ...priority.filter((k) => allKeys.includes(k)),
      ...allKeys.filter((k) => !priority.includes(k)),
    ];

    for (const k of ordered) {
      const found = walk((node as any)[k], depth + 1);
      if (found) return found;
    }
    return null;
  };

  const result = walk(root, 0);
  if (!result) {
    // eslint-disable-next-line no-console
    console.warn(`[extractArray:${label}] No array found in:`, root);
  }
  return result ?? [];
};

/* ------------------------------------------------------------------ */
/* Response normalizer — paginated arrays                              */
/* ------------------------------------------------------------------ */

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

const TOTAL_KEYS = ["total", "count", "totalCount", "totalItems", "totalRecords"];
const LIMIT_KEYS = ["limit", "pageSize", "perPage", "size", "take"];
const PAGE_KEYS = ["page", "currentPage", "pageNumber", "pageIndex"];
const TOTAL_PAGES_KEYS = ["totalPages", "pageCount", "pages"];
const META_WRAPPERS = ["meta", "pagination", "pageInfo", "page_info", "paging"];

/**
 * Attempts to pull pagination meta out of a node. Looks both at the
 * node's own keys and inside common wrapper keys (meta, pagination, ...).
 */
const extractPaginationMeta = (
  node: any,
  fallbackLimit: number,
): PaginationMeta | null => {
  if (!node || typeof node !== "object") return null;

  // Try keys on this node first
  let total: number | undefined;
  for (const k of TOTAL_KEYS) {
    if (typeof node[k] === "number") {
      total = node[k];
      break;
    }
  }

  if (typeof total === "number") {
    let limit = fallbackLimit;
    for (const k of LIMIT_KEYS) {
      if (typeof node[k] === "number" && node[k] > 0) {
        limit = node[k];
        break;
      }
    }
    let page = 1;
    for (const k of PAGE_KEYS) {
      if (typeof node[k] === "number" && node[k] > 0) {
        page = node[k];
        break;
      }
    }
    let totalPages = Math.max(1, Math.ceil(total / limit));
    for (const k of TOTAL_PAGES_KEYS) {
      if (typeof node[k] === "number" && node[k] >= 0) {
        totalPages = node[k];
        break;
      }
    }
    return { total, page, limit, totalPages };
  }

  // Recurse into wrapper keys
  for (const k of META_WRAPPERS) {
    const sub = node[k];
    if (sub && typeof sub === "object") {
      const found = extractPaginationMeta(sub, fallbackLimit);
      if (found) return found;
    }
  }

  return null;
};

/**
 * Walks the response to find the first array of objects AND its
 * sibling pagination metadata. Falls back to `extractArray` if no meta
 * is found (so unpaginated endpoints still work).
 */
const extractPaginated = <T,>(
  root: any,
  fallbackLimit: number,
): PaginatedResult<T> => {
  const seen = new WeakSet<object>();

  const walk = (node: any, depth: number): PaginatedResult<T> | null => {
    if (depth > 6 || node == null) return null;
    if (typeof node !== "object") return null;
    if (seen.has(node as object)) return null;
    seen.add(node as object);

    const arrayPriority = [
      "users",
      "data",
      "items",
      "results",
      "rows",
      "list",
      "records",
      "response",
    ];
    const allKeys = Object.keys(node);
    const ordered = [
      ...arrayPriority.filter((k) => allKeys.includes(k)),
      ...allKeys.filter((k) => !arrayPriority.includes(k)),
    ];

    // 1. Look for a sibling array of objects
    for (const k of ordered) {
      const child = (node as any)[k];
      if (Array.isArray(child)) {
        const first = child[0];
        const isObjArray =
          child.length === 0 || (first != null && typeof first === "object");
        if (isObjArray) {
          const meta = extractPaginationMeta(node, fallbackLimit);
          if (meta) {
            return { items: child as T[], meta };
          }
        }
      }
    }

    // 2. Recurse
    for (const k of ordered) {
      const found = walk((node as any)[k], depth + 1);
      if (found) return found;
    }

    return null;
  };

  const result = walk(root, 0);
  if (result) return result;

  // Fallback: unpaginated array
  const arr = extractArray<T>(root, "paginated-fallback");
  return {
    items: arr,
    meta: {
      total: arr.length,
      page: 1,
      limit: fallbackLimit,
      totalPages: Math.max(1, Math.ceil(arr.length / fallbackLimit)),
    },
  };
};

/* ------------------------------------------------------------------ */
/* Pagination helpers                                                  */
/* ------------------------------------------------------------------ */

/** [1, 2, 3, …, 9, 10] */
function getPaginationRange(
  current: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | "ellipsis")[] = [];
  range.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) range.push("ellipsis");
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages - 1) range.push("ellipsis");

  range.push(totalPages);
  return range;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type AdminTab = "users" | "redeemCodes";

type UserFormData = CreateUser & { id?: string };
type RedeemCodeFormData = CreateRedeemCode & { id?: number };

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AdminComponent() {
  const t = useTranslations("admin");

  /* ---------- Navigation ---------- */
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  /* ---------- Users (paginated from server) ---------- */
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");

  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(20);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);

  /* ---------- Redeem codes + years ---------- */
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | "all">("all");

  /* ---------- Loading ---------- */
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ---------- Modals ---------- */
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [redeemCodeModalOpen, setRedeemCodeModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const [editingRedeemCode, setEditingRedeemCode] =
    useState<RedeemCodeFormData | null>(null);

  /* ---------- Forms ---------- */
  const [userForm, setUserForm] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    role: "teacher",
  });

  const [redeemCodeForm, setRedeemCodeForm] = useState<RedeemCodeFormData>({
    yearId: undefined,
  });

  /* ---------- Confirm ---------- */
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmDeleteRedeemCode, setConfirmDeleteRedeemCode] =
    useState<RedeemCode | null>(null);

  /* ---------- Toast ---------- */
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  /* ------------------------------------------------------------------ */
  /* Fetch users (paginated + filtered server-side)                      */
  /* ------------------------------------------------------------------ */

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await getAllUsers(userPage, userLimit, debouncedSearch.trim());

      if (res.status) {
        const { items, meta } = extractPaginated<User>(res, userLimit);
        setUsers(items);
        setUserTotal(meta.total);
        setUserTotalPages(meta.totalPages);

        // If the current page no longer exists (e.g. after filtering),
        // clamp it back into range — a re-render will refetch.
        if (meta.totalPages > 0 && userPage > meta.totalPages) {
          setUserPage(meta.totalPages);
        }
      } else {
        showToast("error", res.message || "Failed to load users");
      }
    } catch {
      showToast("error", "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [
    userPage,
    userLimit,
    debouncedSearch,
    userRoleFilter,
    userStatusFilter,
    showToast,
  ]);

  /* ------------------------------------------------------------------ */
  /* Fetch redeem codes + years                                          */
  /* ------------------------------------------------------------------ */

  const fetchCodesAndYears = useCallback(async () => {
    try {
      const [codesRes, yearsRes] = await Promise.all([
        getAllRedeemCodes(),
        getYears(),
      ]);

      if (codesRes.status) {
        setRedeemCodes(extractArray<RedeemCode>(codesRes, "redeemCodes"));
      }
      if (yearsRes.status) {
        setYears(extractArray<Year>(yearsRes, "years"));
      }
    } catch {
      showToast("error", "Failed to load data");
    }
  }, [showToast]);

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */

  // Initial page load: only codes + years. Users are loaded by their own effect.
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await fetchCodesAndYears();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCodesAndYears]);

  // Users: refetch whenever any relevant param changes (fetchUsers identity).
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce the search input → updates debouncedSearch + resets to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch);
      setUserPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [userSearch]);

  /* ------------------------------------------------------------------ */
  /* Refresh                                                             */
  /* ------------------------------------------------------------------ */

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUsers(), fetchCodesAndYears()]);
    } finally {
      setRefreshing(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Derived — redeem codes grouped by year                              */
  /* ------------------------------------------------------------------ */

  const codesByYear = useMemo(() => {
    const filtered =
      selectedYearId === "all"
        ? redeemCodes
        : redeemCodes.filter((c) => c.year?.id === selectedYearId);

    const map = new Map<number | "none", RedeemCode[]>();
    for (const code of filtered) {
      const key = code.year?.id ?? "none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(code);
    }

    const groups: {
      key: number | "none";
      year: Year | null;
      codes: RedeemCode[];
      used: number;
      total: number;
    }[] = [];

    map.forEach((codes, key) => {
      const year =
        key === "none"
          ? null
          : years.find((y) => y.id === key) ?? codes[0]?.year ?? null;
      groups.push({
        key,
        year,
        codes,
        used: codes.filter((c) => c.isActivated).length,
        total: codes.length,
      });
    });

    groups.sort((a, b) => {
      if (a.key === "none") return 1;
      if (b.key === "none") return -1;
      return (a.key as number) - (b.key as number);
    });

    return groups;
  }, [redeemCodes, years, selectedYearId]);

  /* ------------------------------------------------------------------ */
  /* User actions                                                        */
  /* ------------------------------------------------------------------ */

  const emptyUserForm = (): UserFormData => ({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    role: "teacher",
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createUser(userForm);
      if (res.status) {
        showToast("success", "User created successfully");
        setUserModalOpen(false);
        setUserForm(emptyUserForm());
        await fetchUsers();
      } else {
        showToast("error", res.message || "Failed to create user");
      }
    } catch {
      showToast("error", "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.id) return;
    setSaving(true);
    try {
      const data: UpdateUser = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        username: userForm.username,
        phone: userForm.phone,
        email: userForm.email,
        role: userForm.role,
      };
      const res = await updateUser(editingUser.id, data);
      if (res.status) {
        showToast("success", "User updated successfully");
        setUserModalOpen(false);
        setEditingUser(null);
        setUserForm(emptyUserForm());
        await fetchUsers();
      } else {
        showToast("error", res.message || "Failed to update user");
      }
    } catch {
      showToast("error", "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setDeleting(true);
    try {
      const res = await deleteUser(confirmDeleteUser.id);
      if (res.status) {
        showToast("success", "User deleted successfully");
        setConfirmDeleteUser(null);
        await fetchUsers();
      } else {
        showToast("error", res.message || "Failed to delete user");
      }
    } catch {
      showToast("error", "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user as any);
      setUserForm({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        email: user.email,
        password: "",
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setUserForm(emptyUserForm());
    }
    setUserModalOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /* Redeem code actions                                                 */
  /* ------------------------------------------------------------------ */

  const handleCreateRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeForm.yearId) {
      showToast("error", t("form.yearRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await postRedeemCode({
        yearId: Number(redeemCodeForm.yearId),
      });
      if (res.status) {
        showToast("success", "Redeem code created successfully");
        setRedeemCodeModalOpen(false);
        setRedeemCodeForm({ yearId: undefined });
        await fetchCodesAndYears();
      } else {
        showToast("error", res.message || "Failed to create redeem code");
      }
    } catch {
      showToast("error", "Failed to create redeem code");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRedeemCode?.id) return;
    if (!redeemCodeForm.yearId) {
      showToast("error", t("form.yearRequired"));
      return;
    }
    setSaving(true);
    try {
      const data: UpdateRedeemCode = {
        yearId: Number(redeemCodeForm.yearId),
      };
      const res = await updateRedeemCode(editingRedeemCode.id, data);
      if (res.status) {
        showToast("success", "Redeem code updated successfully");
        setRedeemCodeModalOpen(false);
        setEditingRedeemCode(null);
        setRedeemCodeForm({ yearId: undefined });
        await fetchCodesAndYears();
      } else {
        showToast("error", res.message || "Failed to update redeem code");
      }
    } catch {
      showToast("error", "Failed to update redeem code");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRedeemCode = async () => {
    if (!confirmDeleteRedeemCode) return;
    setDeleting(true);
    try {
      const res = await deleteRedeemCode(confirmDeleteRedeemCode.id);
      if (res.status) {
        showToast("success", "Redeem code deleted successfully");
        setConfirmDeleteRedeemCode(null);
        await fetchCodesAndYears();
      } else {
        showToast("error", res.message || "Failed to delete redeem code");
      }
    } catch {
      showToast("error", "Failed to delete redeem code");
    } finally {
      setDeleting(false);
    }
  };

  const openRedeemCodeModal = (code?: RedeemCode) => {
    if (code) {
      setEditingRedeemCode(code as any);
      setRedeemCodeForm({
        id: code.id,
        yearId: code.year?.id,
      });
    } else {
      setEditingRedeemCode(null);
      setRedeemCodeForm({ yearId: undefined });
    }
    setRedeemCodeModalOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /* Filter change handlers (reset to page 1)                            */
  /* ------------------------------------------------------------------ */

  const handleRoleFilterChange = (value: string) => {
    setUserRoleFilter(value);
    setUserPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setUserStatusFilter(value);
    setUserPage(1);
  };

  const handleLimitChange = (value: number) => {
    setUserLimit(value);
    setUserPage(1);
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const showEmptyState =
    users.length === 0 &&
    userTotal === 0 &&
    !debouncedSearch.trim() &&
    userRoleFilter === "all" &&
    userStatusFilter === "all";

  const rangeFrom = userTotal === 0 ? 0 : (userPage - 1) * userLimit + 1;
  const rangeTo = Math.min(userPage * userLimit, userTotal);

  return (
    <div className={styles.page}>
      <div className={styles.bgDecoration} aria-hidden />

      <div className={styles.wrapper}>
        {/* ============ Header ============ */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{t("title")}</h1>
            <p className={styles.pageSubtitle}>{t("subtitle")}</p>
          </div>
          <div className={styles.headerActions}>
            <a
              href="/teacher"
              className={styles.primaryButton}
              title={t("teacher.goToTeacher")}
            >
              <GraduationCap size={16} />
              <span>{t("teacher.goToTeacher")}</span>
              <ChevronRight size={14} />
            </a>
            <button
              onClick={handleRefresh}
              className={styles.iconButton}
              aria-label={t("refresh")}
              disabled={refreshing}
            >
              <RefreshCw
                size={18}
                className={refreshing ? styles.spinning : ""}
              />
            </button>
          </div>
        </header>

        {/* ============ Tabs ============ */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab("users")}
            className={`${styles.tab} ${activeTab === "users" ? styles.tabActive : ""
              }`}
          >
            <Users size={18} />
            <span>{t("tabs.users")}</span>
            <span className={styles.tabCount}>{userTotal}</span>
          </button>
          <button
            onClick={() => setActiveTab("redeemCodes")}
            className={`${styles.tab} ${activeTab === "redeemCodes" ? styles.tabActive : ""
              }`}
          >
            <Key size={18} />
            <span>{t("tabs.redeemCodes")}</span>
            <span className={styles.tabCount}>{redeemCodes.length}</span>
          </button>
        </div>

        {/* ============ Body ============ */}
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinning} size={32} />
            <span>{t("loading")}</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ==================== USERS ==================== */}
            {activeTab === "users" && (
              <motion.section
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.filters}>
                  <div className={styles.searchBox}>
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">{t("filters.allRoles")}</option>
                    <option value="admin">{t("roles.admin")}</option>
                    <option value="teacher">{t("roles.teacher")}</option>
                    <option value="user">{t("roles.user")}</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">{t("filters.allStatus")}</option>
                    <option value="active">{t("filters.active")}</option>
                    <option value="inactive">{t("filters.inactive")}</option>
                  </select>

                  <button
                    onClick={() => openUserModal()}
                    className={styles.primaryButton}
                  >
                    <Plus size={16} />
                    <span>{t("actions.createUser")}</span>
                  </button>
                </div>

                <div className={styles.tableContainer} style={{ position: "relative" }}>
                  {usersLoading && (
                    <div className={styles.tableLoadingOverlay}>
                      <Loader2 size={22} className={styles.spinning} />
                    </div>
                  )}

                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t("table.username")}</th>
                        <th>{t("table.email")}</th>
                        <th>{t("table.role")}</th>
                        <th>{t("table.status")}</th>
                        <th>{t("table.createdAt")}</th>
                        <th>{t("table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className={styles.userCell}>
                              <div className={styles.userAvatar}>
                                {user.firstName?.[0]?.toUpperCase() ||
                                  user.username?.[0]?.toUpperCase() ||
                                  "U"}
                              </div>
                              <div>
                                <div className={styles.userName}>
                                  {user.username}
                                </div>
                                <div className={styles.userFullName}>
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${styles[
                                `badge${(user.role ?? "")
                                  .charAt(0)
                                  .toUpperCase() +
                                (user.role ?? "").slice(1)
                                }`
                              ] ?? ""
                                }`}
                            >
                              {t(`roles.${user.role}`)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${user.isActive
                                ? styles.statusActive
                                : styles.statusInactive
                                }`}
                            >
                              {user.isActive ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                              {user.isActive
                                ? t("status.active")
                                : t("status.inactive")}
                            </span>
                          </td>
                          <td>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                onClick={() => openUserModal(user)}
                                className={styles.iconButton}
                                title={t("actions.edit")}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteUser(user)}
                                className={`${styles.iconButton} ${styles.danger}`}
                                title={t("actions.delete")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className={styles.emptyState}>
                      <Users size={48} />
                      <p>
                        {showEmptyState
                          ? t("empty.usersNoData")
                          : t("empty.users")}
                      </p>
                    </div>
                  )}
                </div>

                {/* ---------- Pagination ---------- */}
                {userTotal > 0 && (
                  <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                      {t("pagination.showing", {
                        from: rangeFrom,
                        to: rangeTo,
                        total: userTotal,
                      })}
                    </div>

                    <div className={styles.paginationControls}>
                      <button
                        type="button"
                        className={styles.paginationBtn}
                        disabled={userPage <= 1 || usersLoading}
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        aria-label={t("pagination.previous")}
                        title={t("pagination.previous")}
                      >
                        <ChevronLeft size={14} />
                      </button>

                      {getPaginationRange(userPage, userTotalPages).map(
                        (item, i) =>
                          item === "ellipsis" ? (
                            <span
                              key={`e-${i}`}
                              className={styles.paginationEllipsis}
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              className={`${styles.paginationBtn} ${item === userPage
                                ? styles.paginationBtnActive
                                : ""
                                }`}
                              disabled={usersLoading}
                              onClick={() => setUserPage(item)}
                            >
                              {item}
                            </button>
                          ),
                      )}

                      <button
                        type="button"
                        className={styles.paginationBtn}
                        disabled={
                          userPage >= userTotalPages || usersLoading
                        }
                        onClick={() =>
                          setUserPage((p) => Math.min(userTotalPages, p + 1))
                        }
                        aria-label={t("pagination.next")}
                        title={t("pagination.next")}
                      >
                        <ChevronRight size={14} />
                      </button>

                      <select
                        className={styles.paginationSelect}
                        value={userLimit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        disabled={usersLoading}
                        aria-label={t("pagination.pageSize")}
                        title={t("pagination.pageSize")}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* ==================== REDEEM CODES ==================== */}
            {activeTab === "redeemCodes" && (
              <motion.section
                key="redeemCodes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {t("redeemCodes.title")}
                  </h2>
                  <button
                    onClick={() => openRedeemCodeModal()}
                    className={styles.primaryButton}
                  >
                    <Plus size={16} />
                    <span>{t("actions.createRedeemCode")}</span>
                  </button>
                </div>

                <div className={styles.yearFilter}>
                  <button
                    onClick={() => setSelectedYearId("all")}
                    className={`${styles.yearChip} ${selectedYearId === "all" ? styles.yearChipActive : ""
                      }`}
                  >
                    {t("redeemCodes.allYears")}
                    <span className={styles.yearChipCount}>
                      {redeemCodes.length}
                    </span>
                  </button>

                  {years.map((year) => {
                    const count = redeemCodes.filter(
                      (c) => c.year?.id === year.id,
                    ).length;
                    return (
                      <button
                        key={year.id}
                        onClick={() => setSelectedYearId(year.id)}
                        className={`${styles.yearChip} ${selectedYearId === year.id
                          ? styles.yearChipActive
                          : ""
                          }`}
                      >
                        <Calendar size={12} />
                        {year.name}
                        <span className={styles.yearChipCount}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {codesByYear.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Key size={48} />
                    <p>{t("empty.redeemCodes")}</p>
                  </div>
                ) : (
                  <div className={styles.yearGroups}>
                    {codesByYear.map((group) => (
                      <div key={group.key} className={styles.yearGroup}>
                        <header className={styles.yearGroupHeader}>
                          <div className={styles.yearGroupTitle}>
                            <span className={styles.yearGroupIcon}>
                              <Calendar size={14} />
                            </span>
                            <h3>
                              {group.year?.name ?? t("redeemCodes.noYear")}
                            </h3>
                            <span className={styles.yearGroupCount}>
                              {group.total}
                            </span>
                          </div>

                          <div className={styles.yearGroupStats}>
                            <span
                              className={`${styles.yearStat} ${styles.yearStatAvailable}`}
                            >
                              <span className={styles.yearStatDot} />
                              {group.total - group.used}{" "}
                              {t("status.available")}
                            </span>
                            <span
                              className={`${styles.yearStat} ${styles.yearStatUsed}`}
                            >
                              <span className={styles.yearStatDot} />
                              {group.used} {t("status.used")}
                            </span>
                          </div>
                        </header>

                        <div className={styles.redeemCodesGrid}>
                          {group.codes.map((code) => (
                            <div
                              key={code.id}
                              className={styles.redeemCodeCard}
                            >
                              <div className={styles.redeemCodeHeader}>
                                <div className={styles.redeemCodeIcon}>
                                  <Key size={20} />
                                </div>
                                <div className={styles.redeemCodeStatus}>
                                  <span
                                    className={`${styles.statusDot} ${code.isActivated
                                      ? styles.statusDotActive
                                      : styles.statusDotInactive
                                      }`}
                                  />
                                  {code.isActivated
                                    ? t("status.used")
                                    : t("status.available")}
                                </div>
                              </div>

                              <div className={styles.redeemCodeBody}>
                                <h3 className={styles.redeemCodeValue}>
                                  {code.code}
                                </h3>

                                {code.expiryDate && (
                                  <p className={styles.redeemCodeMeta}>
                                    <Clock size={12} />
                                    {new Date(
                                      code.expiryDate,
                                    ).toLocaleDateString()}
                                  </p>
                                )}

                                {code.user && (
                                  <p className={styles.redeemCodeMeta}>
                                    <Users size={12} />
                                    {code.user.username}
                                  </p>
                                )}

                                {code.activationDate && (
                                  <p className={styles.redeemCodeMeta}>
                                    <Check size={12} />
                                    {new Date(
                                      code.activationDate,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>

                              <div className={styles.redeemCodeActions}>
                                <button
                                  onClick={() => openRedeemCodeModal(code)}
                                  className={styles.iconButton}
                                  title={t("actions.edit")}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmDeleteRedeemCode(code)
                                  }
                                  className={`${styles.iconButton} ${styles.danger}`}
                                  title={t("actions.delete")}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ==================== USER MODAL ==================== */}
      <AnimatePresence>
        {userModalOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setUserModalOpen(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingUser
                    ? t("actions.editUser")
                    : t("actions.createUser")}
                </h2>
                <button
                  onClick={() => !saving && setUserModalOpen(false)}
                  className={styles.iconButton}
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                className={styles.form}
              >
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {t("form.firstName")} *
                    </label>
                    <input
                      type="text"
                      value={userForm.firstName}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          firstName: e.target.value,
                        })
                      }
                      required
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {t("form.lastName")} *
                    </label>
                    <input
                      type="text"
                      value={userForm.lastName}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          lastName: e.target.value,
                        })
                      }
                      required
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("form.username")} *
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("form.email")} *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("form.phone")}</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phone: e.target.value })
                    }
                    className={styles.input}
                  />
                </div>

                {!editingUser && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {t("form.password")} *
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          password: e.target.value,
                        })
                      }
                      required
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("form.role")} *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    required
                    className={styles.select}
                  >
                    <option value="teacher">{t("roles.teacher")}</option>
                    <option value="admin">{t("roles.admin")}</option>
                    <option value="user">{t("roles.user")}</option>
                  </select>
                  <p className={styles.formHint}>
                    {t("form.roleHint")}
                  </p>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => !saving && setUserModalOpen(false)}
                    className={styles.secondaryButton}
                    disabled={saving}
                  >
                    {t("actions.cancel")}
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className={styles.spinning} size={16} />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          {editingUser
                            ? t("actions.save")
                            : t("actions.create")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== REDEEM CODE MODAL ==================== */}
      <AnimatePresence>
        {redeemCodeModalOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setRedeemCodeModalOpen(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingRedeemCode
                    ? t("actions.editRedeemCode")
                    : t("actions.createRedeemCode")}
                </h2>
                <button
                  onClick={() => !saving && setRedeemCodeModalOpen(false)}
                  className={styles.iconButton}
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={
                  editingRedeemCode
                    ? handleUpdateRedeemCode
                    : handleCreateRedeemCode
                }
                className={styles.form}
              >
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("form.year")} *</label>
                  <select
                    value={redeemCodeForm.yearId ?? ""}
                    onChange={(e) =>
                      setRedeemCodeForm({
                        ...redeemCodeForm,
                        yearId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    required
                    className={styles.select}
                  >
                    <option value="">{t("form.selectYear")}</option>
                    {years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                  <p className={styles.formHint}>
                    {t("form.redeemCodeHint")}
                  </p>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => !saving && setRedeemCodeModalOpen(false)}
                    className={styles.secondaryButton}
                    disabled={saving}
                  >
                    {t("actions.cancel")}
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving || !redeemCodeForm.yearId}
                  >
                    {saving ? (
                      <Loader2 className={styles.spinning} size={16} />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          {editingRedeemCode
                            ? t("actions.save")
                            : t("actions.create")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CONFIRM: DELETE USER ==================== */}
      <AnimatePresence>
        {confirmDeleteUser && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setConfirmDeleteUser(null)}
          >
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>
                <AlertCircle size={32} />
              </div>
              <h2 className={styles.confirmTitle}>
                {t("confirm.deleteUser")}
              </h2>
              <p className={styles.confirmText}>
                {t("confirm.deleteUserMessage", {
                  username: confirmDeleteUser.username,
                })}
              </p>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setConfirmDeleteUser(null)}
                  className={styles.secondaryButton}
                  disabled={deleting}
                >
                  {t("actions.cancel")}
                </button>
                <button
                  onClick={handleDeleteUser}
                  className={styles.dangerButton}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className={styles.spinning} size={16} />
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>{t("actions.delete")}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CONFIRM: DELETE REDEEM CODE ==================== */}
      <AnimatePresence>
        {confirmDeleteRedeemCode && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setConfirmDeleteRedeemCode(null)}
          >
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>
                <AlertCircle size={32} />
              </div>
              <h2 className={styles.confirmTitle}>
                {t("confirm.deleteRedeemCode")}
              </h2>
              <p className={styles.confirmText}>
                {t("confirm.deleteRedeemCodeMessage", {
                  code: confirmDeleteRedeemCode.code,
                })}
              </p>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setConfirmDeleteRedeemCode(null)}
                  className={styles.secondaryButton}
                  disabled={deleting}
                >
                  {t("actions.cancel")}
                </button>
                <button
                  onClick={handleDeleteRedeemCode}
                  className={styles.dangerButton}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className={styles.spinning} size={16} />
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>{t("actions.delete")}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== TOAST ==================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`${styles.toast} ${toast.type === "success"
              ? styles.toastSuccess
              : styles.toastError
              }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
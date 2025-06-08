import { useState, useCallback } from "react";

export const useQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchQuestions = useCallback(
    async (params = {}, updatedQuestions = null) => {
      // If updatedQuestions is provided, update the state without fetching
      if (updatedQuestions) {
        setQuestions(updatedQuestions);
        return;
      }

      setLoading(true);
      try {
        const {
          page = 1,
          limit = 10,
          search = "",
          status = "all",
          category = "all",
          sort = "newest",
        } = params;
        let url = `/api/questions?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status !== "all") url += `&status=${status}`;
        if (category !== "all") url += `&category=${category}`;
        if (sort) url += `&sort=${sort}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        setQuestions(data.questions);
        setTotalPages(data.totalPages);
        setCurrentPage(page);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const submitQuestion = useCallback(async (questionData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (!res.ok) throw new Error("Failed to submit question");
      const newQuestion = await res.json();
      setQuestions((prev) => [newQuestion, ...prev]);
      setError(null);
      return newQuestion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuestion = useCallback(async (questionId, updateData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update question");
      const updatedQuestion = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q._id === questionId ? updatedQuestion : q))
      );
      setError(null);
      return updatedQuestion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteQuestion = useCallback(async (questionId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete question");
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleHelpful = useCallback(async (questionId, userId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "helpful" }),
      });
      if (!res.ok) throw new Error("Failed to toggle helpful vote");
      const updatedQuestion = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q._id === questionId ? updatedQuestion : q))
      );
      setError(null);
      return updatedQuestion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bookmarkQuestion = useCallback(async (questionId, userId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to bookmark question");
      const updatedQuestion = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q._id === questionId ? updatedQuestion : q))
      );
      setError(null);
      return updatedQuestion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    questions,
    totalPages,
    currentPage,
    fetchQuestions,
    submitQuestion,
    updateQuestion,
    deleteQuestion,
    toggleHelpful,
    bookmarkQuestion,
    setCurrentPage,
  };
};

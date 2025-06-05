"use client";

import { useState, useEffect } from "react";

export const useDashboardData = () => {
  const [data, setData] = useState({
    users: [],
    videos: [],
    books: [],
    events: [],
    institutions: [],
    questions: [],
    comments: [],
    reviews: [],
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalBooks: 0,
    totalEvents: 0,
    totalInstitutions: 0,
    totalQuestions: 0,
    totalComments: 0,
    totalReviews: 0,
    lastMonthUsers: 0,
    lastMonthVideos: 0,
    lastMonthBooks: 0,
    lastMonthEvents: 0,
    lastMonthInstitutions: 0,
    lastMonthQuestions: 0,
    lastMonthComments: 0,
    lastMonthReviews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/analytics");
        const analyticsData = await response.json();

        if (!response.ok) {
          throw new Error(
            analyticsData.error || "Failed to fetch dashboard data"
          );
        }

        // Set the data
        setData({
          users: analyticsData.users.data,
          videos: analyticsData.videos.data,
          books: analyticsData.books.data,
          events: analyticsData.events.data,
          institutions: analyticsData.institutions.data,
          questions: analyticsData.questions.data,
          comments: analyticsData.comments.data,
          reviews: analyticsData.reviews.data,
        });

        // Set the stats
        setStats({
          totalUsers: analyticsData.users.totalCount,
          totalVideos: analyticsData.videos.totalCount,
          totalBooks: analyticsData.books.totalCount,
          totalEvents: analyticsData.events.totalCount,
          totalInstitutions: analyticsData.institutions.totalCount,
          totalQuestions: analyticsData.questions.totalCount,
          totalComments: analyticsData.comments.totalCount,
          totalReviews: analyticsData.reviews.totalCount,
          lastMonthUsers: analyticsData.users.lastMonthUsers,
          lastMonthVideos: analyticsData.videos.lastMonthVideos,
          lastMonthBooks: analyticsData.books.lastMonthBooks,
          lastMonthEvents: analyticsData.events.lastMonthEvents,
          lastMonthInstitutions:
            analyticsData.institutions.lastMonthInstitutions,
          lastMonthQuestions: analyticsData.questions.lastMonthQuestions,
          lastMonthComments: analyticsData.comments.lastMonthComments,
          lastMonthReviews: analyticsData.reviews.lastMonthReviews,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, stats, loading, error };
};

import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoritesMovies, setFavoritesMovies] = useState([]);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "";

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to detect axios cancellation with AbortController
  const isAbortError = (err) =>
    err?.name === "CanceledError" || err?.message === "canceled";

  const fetchIsAdmin = useCallback(async (signal) => {
    try {
      const token = await getToken();
      if (!token) {
        setIsAdmin(false);
        return;
      }

      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      setIsAdmin(Boolean(data.isAdmin));

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("fetchIsAdmin error:", error);
      setIsAdmin(false);
    }
  }, [getToken, location.pathname, navigate]);

  const fetchShows = useCallback(async (signal) => {
    try {
      const { data } = await axios.get("/api/show/all", { signal });
      if (data?.success) {
        setShows(data.shows || []);
      } else {
        toast.error(data?.message || "Failed to fetch shows");
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("fetchShows error:", error);
      toast.error("Failed to fetch shows");
    }
  }, []);

  const fetchFavoriteMovies = useCallback(async (signal) => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      if (data?.success) {
        setFavoritesMovies(data.movies || []);
      } else {
        toast.error(data?.message || "Failed to fetch favorites");
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error("fetchFavoriteMovies error:", error);
      toast.error("Failed to fetch favorite movies");
    }
  }, [getToken]);

  // Load shows on mount with cancellation
  useEffect(() => {
    const controller = new AbortController();
    fetchShows(controller.signal);
    return () => controller.abort();
  }, [fetchShows]);

  // When user changes (login/logout), handle admin & favorites
  useEffect(() => {
    const controller = new AbortController();

    if (user) {
      // only call when there's a user
      fetchIsAdmin(controller.signal);
      fetchFavoriteMovies(controller.signal);
    } else {
      // clear sensitive state on logout
      setIsAdmin(false);
      setFavoritesMovies([]);
    }

    return () => controller.abort();
  }, [user, fetchIsAdmin, fetchFavoriteMovies]);

  const value = useMemo(
    () => ({
      axios,
      fetchIsAdmin,
      user,
      getToken,
      navigate,
      isAdmin,
      shows,
      favoritesMovies,
      fetchFavoriteMovies,
      image_base_url,
    }),
    [
      fetchIsAdmin,
      user,
      getToken,
      navigate,
      isAdmin,
      shows,
      favoritesMovies,
      fetchFavoriteMovies,
      image_base_url,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

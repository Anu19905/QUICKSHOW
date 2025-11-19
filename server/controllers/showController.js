import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// GET now playing (unchanged)
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get(
            "https://api.themoviedb.org/3/movie/now_playing",
            { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` } }
        );
        return res.json({ success: true, movies: data.results || [] });
    } catch (error) {
        console.error("TMDB getNowPlaying error:", error.response?.status, error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.status_message || error.message,
        });
    }
};

// POST add show
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body;

        // Basic validation
        if (!movieId) {
            return res.status(400).json({ success: false, message: "movieId is required" });
        }
        if (!Array.isArray(showsInput) || showsInput.length === 0) {
            return res.status(400).json({ success: false, message: "showsInput must be a non-empty array" });
        }
        if (typeof showPrice !== "number") {
            return res.status(400).json({ success: false, message: "showPrice must be a number" });
        }

        let movie = await Movie.findById(String(movieId));

        if (!movie) {
            // Fetch movie details & credits from TMDB
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
                }),
            ]);

            const movieApiData = movieDetailsResponse.data || {};
            const movieCreditsData = movieCreditsResponse.data || {};

            const movieDetails = {
                _id: String(movieId),
                title: movieApiData.title || "",
                overview: movieApiData.overview || "",
                poster_path: movieApiData.poster_path || "",
                backdrop_path: movieApiData.backdrop_path || "", // <-- fixed typo
                genres: movieApiData.genres || [],
                casts: movieCreditsData.cast || [],
                release_date: movieApiData.release_date || "",
                original_language: movieApiData.original_language || "",
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average ?? 0,
                runtime: movieApiData.runtime ?? 0,
            };

            movie = await Movie.create(movieDetails);
        }

        // Build shows
        const showsToCreate = [];
        for (const show of showsInput) {
            const showDate = show?.date;
            const times = Array.isArray(show?.time) ? show.time : [];

            if (!showDate || times.length === 0) continue;

            for (const time of times) {
                // time should be 'HH:mm' or 'HH:mm:ss'
                const dateTimeString = `${showDate}T${time}`;
                const dateObj = new Date(dateTimeString);
                if (isNaN(dateObj.getTime())) {
                    // skip invalid date/time combos
                    console.warn("Skipping invalid date/time:", dateTimeString);
                    continue;
                }

                showsToCreate.push({
                    movie: String(movieId),
                    showDateTime: dateObj,
                    showPrice,
                    // match the field name in your Show schema. earlier you saved "occupiedDSeats"
                    occupiedDSeats: {},
                });
            }
        }

        if (showsToCreate.length === 0) {
            return res.status(400).json({ success: false, message: "No valid shows to create" });
        }

        await Show.insertMany(showsToCreate);
        return res.json({ success: true, message: "Show added successfully." });
    } catch (error) {
        console.error("addShow error:", error.response?.status, error.response?.data || error.message || error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.status_message || error.message || "Server error";
        return res.status(status).json({ success: false, message });
    }
};



// API to get shows from the database
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });
        //  filter unique shows
        const uniqueShows = new Set(shows.map(Show => Show.movie))
        res.json({ success: true, shows: Array.from(uniqueShows) })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

//  API to get a single show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        // get all upcoming shows for the movie
        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } })

        const movie = await Movie.findById(movieId);
        const dateTime = {};
        shows.forEach((show) => {
            const date = show.showDateTime.toDateString().split("T")[0];
            if (!dateTime[date]) {
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })
        res.json({ success: true, movie, dateTime })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

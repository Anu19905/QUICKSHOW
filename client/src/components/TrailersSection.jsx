import React, { useState } from 'react';
import { dummyTrailers } from '../assets/assets';
import BlurCircle from './BlurCircle';
import { PlayCircleIcon } from 'lucide-react';


const TrailersSection = () => {
    const [current, setCurrent] = useState(dummyTrailers[0]);

    if (!current) return null;

    // get YouTube embed URL from full YouTube link
    const ytMatch = current.videoUrl.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{6,})/);
    const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : current.videoUrl;

    return (
        <section className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
            <p className="text-gray-300 text-lg font-medium max-w-[960px] mx-auto">Trailers</p>

            {/* Player */}
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                
                <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <BlurCircle  top='-100px' right='-100px'/>
                    <iframe title="trailer" src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>

                {/* Thumbnails */}
                <div className="group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
                    {dummyTrailers.map((trailer) => (
                        <div key={trailer.id} onClick={() => setCurrent(trailer)} className={"relative group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-md:h-60 md:max-h-60 cursor-pointer" +
                            (current.id === trailer.id ? "border-red-500" : "border-transparent")
                        } style={{ width: 160 }}>
                            <img src={trailer.image} alt={trailer.title} className="rounded-lg w-full h-full object-cover brightness-75" />
                            <PlayCircleIcon strokeWidth={1.6} className='absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2' />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrailersSection;

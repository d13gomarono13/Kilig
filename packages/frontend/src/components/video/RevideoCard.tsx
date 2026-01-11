import React, { useRef, useEffect } from 'react';
import { Player } from "@revideo/player-react";
import DynamicScene from "./DynamicScene";

interface RevideoCardProps {
    scene: any;
    isActive?: boolean;
}

const RevideoCard: React.FC<RevideoCardProps> = ({ scene, isActive }) => {
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (isActive && playerRef.current) {
            playerRef.current.play();
        } else if (playerRef.current) {
            playerRef.current.pause();
        }
    }, [isActive]);

    // Wrap the single scene into a one-scene scenegraph
    const miniSceneGraph = {
        scenes: [scene]
    };

    return (
        <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
            <Player
                // @ts-ignore
                ref={playerRef}
                src="/player"
                inputProps={{ sceneGraph: miniSceneGraph }}
                style={{ width: '100%', height: '100%' }}
                controls={isActive}
            />
            {!isActive && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-white/40">
                        <span className="text-3xl text-white">🎬</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevideoCard;

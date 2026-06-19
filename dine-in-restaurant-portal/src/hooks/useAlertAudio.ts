import { useEffect, useRef } from "react";

export const useAlertAudio = (src: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);

    // Initialize audio and unlock after first user interaction
    useEffect(() => {
        audioRef.current = new Audio(src);
        audioRef.current.preload = "auto";

        const unlockAudio = () => {
            if (!audioRef.current || audioUnlockedRef.current) return;

            audioRef.current
                .play()
                .then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                    audioUnlockedRef.current = true;
                })
                .catch(() => {
                    console.log("Audio unlock attempt failed");
                });

            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
        };

        window.addEventListener("click", unlockAudio);
        window.addEventListener("keydown", unlockAudio);

        return () => {
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
        };
    }, [src, audioRef.current, audioUnlockedRef.current]);

    const playAudio = () => {
        if (audioUnlockedRef.current && audioRef.current) {
            audioRef.current
                .play()
                .catch((err) => console.log("Audio play failed:", err));
        }
    };

    return playAudio;
};

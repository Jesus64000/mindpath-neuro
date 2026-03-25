import React, { useState } from 'react';
import { BACKEND_URL } from '../../api/constants';

const Avatar = ({ fullName, profilePictureUrl, size = '12' }) => {
    // Fallback: Obtenemos la inicial (Jane Doe -> J)
    const initial = fullName ? fullName[0].toUpperCase() : '?';

    // Lógica de carga
    const [imageError, setImageError] = useState(false);

    // Si hay una foto y no ha dado error, intentamos cargarla
    if (profilePictureUrl && !imageError) {
        const imgSrc = profilePictureUrl.startsWith('http') 
            ? profilePictureUrl 
            : `${BACKEND_URL}${profilePictureUrl}`;
            
        return (
            <img 
                src={imgSrc} 
                alt={`Avatar de ${fullName}`}
                className={`w-${size} h-${size} rounded-full object-cover border-2 border-mindpath-primary shrink-0`}
                onError={() => setImageError(true)} // Si falla, cambia a true
            />
        );
    }

    // Fallback elegante (la inicial dentro del círculo)
    return (
        <div className={`w-${size} h-${size} shrink-0 rounded-full bg-mindpath-light flex items-center justify-center font-black text-mindpath-primary border-2 border-mindpath-primary text-sm`}>
            {initial}
        </div>
    );
};

export default Avatar;

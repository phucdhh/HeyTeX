import { Users } from 'lucide-react';

interface Collaborator {
    id: string;
    name: string;
    email?: string;
    color?: string;
}

interface CollaboratorAvatarsProps {
    collaborators: Collaborator[];
    maxShow?: number;
}

const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getColorForUser(userId: string): string {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function CollaboratorAvatars({ collaborators, maxShow = 5 }: CollaboratorAvatarsProps) {
    const visibleCollaborators = collaborators.slice(0, maxShow);
    const remainingCount = Math.max(0, collaborators.length - maxShow);

    if (collaborators.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
                {visibleCollaborators.map((collaborator) => (
                    <div
                        key={collaborator.id}
                        className={`
                            relative h-8 w-8 rounded-full border-2 border-background
                            flex items-center justify-center text-white text-xs font-medium
                            ${getColorForUser(collaborator.id)}
                            hover:z-10 hover:scale-110 transition-transform cursor-pointer
                        `}
                        title={`${collaborator.name}${collaborator.email ? ` (${collaborator.email})` : ''}`}
                    >
                        {getInitials(collaborator.name)}
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div
                        className="
                            relative h-8 w-8 rounded-full border-2 border-background
                            flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium
                            hover:z-10 hover:scale-110 transition-transform cursor-pointer
                        "
                        title={`+${remainingCount} more collaborators`}
                    >
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}

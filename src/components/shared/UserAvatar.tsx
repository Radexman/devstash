import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function UserAvatar({ name, image, className, size }: UserAvatarProps) {
  const initials = name ? getInitials(name) : '?';

  return (
    <Avatar className={className} size={size}>
      {image && <AvatarImage src={image} alt={name ?? 'User avatar'} />}
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

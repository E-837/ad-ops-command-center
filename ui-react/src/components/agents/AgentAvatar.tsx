type AgentAvatarProps = {
  name: string;
  size?: 'sm' | 'md';
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AgentAvatar({ name, size = 'md' }: AgentAvatarProps) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div className={`${cls} rounded-full bg-indigo-500/30 border border-indigo-300/30 text-indigo-100 grid place-items-center font-semibold`}>
      {initials(name)}
    </div>
  );
}

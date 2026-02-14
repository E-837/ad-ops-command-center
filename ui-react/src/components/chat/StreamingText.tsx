import { useEffect, useState } from 'react';

export function StreamingText({ text, speed = 12, instant = false }: { text: string; speed?: number; instant?: boolean }) {
  const [visible, setVisible] = useState(instant ? text : '');

  useEffect(() => {
    if (instant) {
      setVisible(text);
      return;
    }

    let i = 0;
    setVisible('');
    const timer = window.setInterval(() => {
      i += 1;
      setVisible(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, speed);

    return () => window.clearInterval(timer);
  }, [instant, speed, text]);

  return <span>{visible}</span>;
}

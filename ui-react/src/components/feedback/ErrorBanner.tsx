export function ErrorBanner({error}:{error:Error}){return <div className='glass rounded-xl p-4 border-red-400/40'>Error: {error.message}</div>;}

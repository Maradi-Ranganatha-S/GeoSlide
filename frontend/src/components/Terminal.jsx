import React, { useEffect, useRef } from 'react';

const Terminal = ({ logs }) => {
  const terminalRef = useRef(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="terminal" ref={terminalRef}>
       {logs.map((l, i) => (
         <div key={i} className="log-line">
           <span className="log-ts">[{l.ts}]</span>
           <span className={`log-msg ${l.type}`}>{l.msg}</span>
         </div>
       ))}
       <div className="log-line">
         <span className="log-ts">_</span>
         <span className="log-msg cmd blink">█</span>
       </div>
    </div>
  );
};

export default Terminal;
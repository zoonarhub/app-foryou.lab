import { useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  if (!isOpen) return null;

  const maxWidth = size === 'lg' ? '800px' : size === 'sm' ? '420px' : '600px';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

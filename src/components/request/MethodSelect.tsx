import React from 'react';
import type { RequestMethod } from '../../models';
import { REQUEST_METHODS } from '../../models';

interface MethodSelectProps {
    method: RequestMethod;
    onChange: (method: RequestMethod) => void;
}

const MethodSelect: React.FC<MethodSelectProps> = ({ method, onChange }) => {
    return (
        <div className="flex flex-col flex-shrink-0" style={{ minWidth: 100 }}>
            <label className="block mb-1">Method</label>
            <select
                value={method}
                onChange={e => onChange(e.target.value as RequestMethod)}
                className={`method-select method-${method.toLowerCase()} bg-cyan-800 p-2 rounded-sm border-2 border-gray-400 text-white font-bold`}
            >
                {REQUEST_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
    );
};

export default MethodSelect; 
import React from 'react';

interface UrlInputProps {
    url: string;
    onChange: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ url, onChange }) => {
    return (
        <div className="flex-1">
            <label className="block mb-1">URL</label>
            <input
                type="text"
                value={url}
                onChange={e => onChange(e.target.value)}
                className="p-2 rounded-sm w-full border-2 border-gray-400 text-white"
                placeholder="https://api.example.com/endpoint"
            />
        </div>
    );
};

export default UrlInput; 
// src/components/thesis/ThesisCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCalendar } from 'react-icons/fi';
import type { Thesis } from '../../types/thesis';

interface ThesisCardProps {
	thesis: Thesis;
}

const ThesisCard: React.FC<ThesisCardProps> = ({ thesis }) => {
	const navigate = useNavigate();

	const handleCardClick = () => {
		navigate(thesis.id, { state: { thesis } });
	};

	return (
		<div
			onClick={handleCardClick}
			className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col overflow-hidden"
		>
			<div className="relative h-48 bg-secondary-100 overflow-hidden">
				<img
					src={thesis.coverImageUrl}
					alt={thesis.title}
					className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				<div className="absolute top-2 left-2 bg-primary-600/90 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
					{thesis.type}
				</div>
				<div className="absolute top-2 right-2 flex items-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-primary-700">
					<FiCalendar className="mr-1" />
					{thesis.year}
				</div>
			</div>
			<div className="p-4 flex flex-col flex-grow">
				<h3 className="font-bold text-md text-gray-800 line-clamp-2" title={thesis.title}>
					{thesis.title}
				</h3>
				<p className="text-sm text-gray-500 flex items-center mt-1">
					<FiUser className="mr-2" />
					{thesis.author}
				</p>
			</div>
		</div>
	);
};

export default ThesisCard;
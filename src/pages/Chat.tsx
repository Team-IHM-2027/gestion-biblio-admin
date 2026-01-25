// src/pages/Chat.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from '../components/chat/ConversationItem';
import { ChatWindow } from '../components/chat/ChatWindow';
import Spinner from '../components/common/Spinner';
import { FiMessageSquare, FiPlus } from 'react-icons/fi'; // Added FiPlus
import NewMessageModal from "../components/chat/NewMessageModal.tsx"; // Import the modal component

export const Chat: React.FC = () => {
	const { conversationId } = useParams<{ conversationId: string }>();
	const { conversations, loading } = useConversations();
	const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false); // State for modal
	const navigate = useNavigate(); // Initialize useNavigate

	return (
		<> {/* Use Fragment to allow modal to be a sibling */}
			<div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] border border-secondary-200 rounded-lg shadow-lg overflow-hidden relative">
				{/* Sidebar: hidden on mobile if a conversation is selected */}
				<aside className={`w-full md:w-1/3 border-r border-secondary-200 flex-col ${conversationId ? 'hidden md:flex' : 'flex'}`}>
					<header className="p-4 border-b border-secondary-200 flex justify-between items-center">
						<h1 className="font-bold text-xl">Messages</h1>
						<button
							onClick={() => setIsNewMessageModalOpen(true)}
							className="p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-colors"
							title="New Message"
						>
							<FiPlus className="w-5 h-5" />
						</button>
					</header>
					<div className="flex-1 overflow-y-auto p-2">
						{loading ? (
							<Spinner />
						) : conversations.length === 0 ? (
							<div className="text-center text-gray-500 p-4">
								No conversations yet. <br />Click the '+' button to start one.
							</div>
						) : (
							<nav>
								<ul>
									{conversations.map(convo => (
										<li key={convo.id}>
											<ConversationItem conversation={convo} />
										</li>
									))}
								</ul>
							</nav>
						)}
					</div>
				</aside>

				{/* Main Content: visible on mobile only if a conversation is selected */}
				<main className={`w-full md:w-2/3 flex flex-col ${conversationId ? 'flex' : 'hidden md:flex'}`}>
					{conversationId ? (
						<ChatWindow />
					) : (
						<div className="flex-1 flex-col items-center justify-center text-center text-gray-500 bg-secondary-50 hidden md:flex">
							<FiMessageSquare className="w-16 h-16 mb-4 text-secondary-400" />
							<h2 className="text-xl font-semibold">Select a conversation</h2>
							<p>Choose a conversation from the list to start chatting, or create a new one.</p>
						</div>
					)}
				</main>
			</div>
			<NewMessageModal
				isOpen={isNewMessageModalOpen}
				onClose={() => setIsNewMessageModalOpen(false)}
				onMessageSent={(userId) => {
					setIsNewMessageModalOpen(false);
					navigate(`/dashboard/messages/${userId}`);
				}}
			/>
		</>
	);
};
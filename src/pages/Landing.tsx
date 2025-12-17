// src/pages/Landing.tsx
import React from 'react';
import Header from "../components/landing/Header.tsx";
import Hero from "../components/landing/Hero.tsx";
import Service from "../components/landing/Service.tsx";
import Statistics from "../components/landing/Statistics.tsx";
import Footer from "../components/layout/Footer.tsx";

const Landing: React.FC = () => {
	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Header />
			<main>
				<Hero />
				<Service />
				<Statistics />
			</main>
			<Footer />
		</div>
	);
};

export default Landing;
import useI18n from "../../hooks/useI18n.ts";
import {useConfig} from "../theme/ConfigProvider.tsx";



function Footer() {
	const { config } = useConfig();
	const { t } = useI18n();
	const currentYear = new Date().getFullYear();

	const renderLogo = () => {
		if (!config?.Logo) return null; // wait until config is loaded
		return (
			<img
			src={config.Logo}
			alt={`${config.Name} Logo`}
			className="w-10 h-10 object-contain"
			onError={(e) => {
				console.error("Failed to load logo:", config.Logo);
				e.currentTarget.style.display = "none"; // optional fallback
			}}
			/>
		);
	};

	return (
		<footer className="bg-gray-800 text-white py-8">
			<div className="container mx-auto px-4">
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="flex items-center space-x-3 mb-4 md:mb-0">
						{renderLogo()}
						<div>
							<h1 className="text-lg font-bold text-white">{config.Name || t('common:app_name')}</h1>
							<p className="text-xs text-white/70">{t('components:footer.powered_by')}</p>
						</div>
					</div>
					<div className="text-white/70 text-sm">
						&copy; {config.Name || t('common:app_name')} {currentYear} {t('components:footer.copyright')}.
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
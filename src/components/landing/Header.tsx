import {useNavigate} from "react-router-dom";
import useI18n from "../../hooks/useI18n.ts";
import LanguageSwitcher from "../common/LanguageSwitcher.tsx";
import {useConfig} from "../theme/ConfigProvider.tsx";


function Header() {

	const navigate = useNavigate();
	const { config } = useConfig();
	const { t } = useI18n();

	const handleEnterSystem = () => {
		navigate('/authentication', );
	};

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
		<header className="bg-primary shadow-md">
			<div className="container mx-auto px-4 py-4 flex justify-between items-center">
				<div className="flex items-center space-x-3">
					{renderLogo()}
					<div>
						<h1 className="text-xl font-bold text-white">{config.Name || t('common:app_name')}</h1>
						<p className="text-xs text-white/80">{t('common:app_subtitle')}</p>
					</div>
				</div>


				<div className="flex items-center space-x-4">
					<LanguageSwitcher variant="landing" />
					<button
						onClick={handleEnterSystem}
						className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-white/90 transition-colors"
					>
						{t('common:login')}
					</button>
				</div>
			</div>
		</header>
	);
}

export default Header;
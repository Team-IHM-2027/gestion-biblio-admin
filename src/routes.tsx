// src/routes.tsx
import {createBrowserRouter, Navigate} from 'react-router-dom';
import Landing from './pages/Landing.tsx';
import Dashboard from "./components/layout/Dashboard.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import AuthLayout from "./components/layout/AuthLayout.tsx";

// Pages
import Overview from './pages/Overview.tsx';
import Users from './pages/Users.tsx';
import Loans from './pages/Loans.tsx';
import OrgConfiguration from "./components/theme/OrgConfiguration.tsx";
import UnderDevelopment from './pages/UnderDevelopment.tsx';
import DefaultLayout from "./components/layout/DefaultLayout.tsx";
import Reservations from './pages/Returns.tsx';
import Archives from './pages/Archives.tsx';
import Departements from "./pages/Departements.tsx";
import Catalogue from "./pages/Catalogue.tsx";
import BookDetails from "./pages/BookDetails.tsx";
import AddBook from "./pages/AddBook.tsx";
import ThesisCatalogue from "./pages/ThesisCatalogue.tsx";
import ThesisDepartment from "./pages/ThesisDepartment.tsx";
import AddThesis from "./pages/AddThesis.tsx";
import ThesisDetails from "./pages/ThesisDetails.tsx";
import Profile from './pages/Profile.tsx';
import { Chat } from "./pages/Chat.tsx";

// Pages d'authentification
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";

const routes = createBrowserRouter([
	{
		path: "/",
		element: <Landing />,
	},
	{
		path: "/authentication",
		element: <AuthLayout />,
		children: [
			{
				index: true, // URL: /authentication
				element: <Login />,
			},
			{
				path: "register", // URL: /authentication/register
				element: <Register />
			}
		]
	},
	{
		path: "/dashboard",
		element: <ProtectedRoute/>,
		children: [
			{
				element: <Dashboard/>,
				children: [
					{ index: true, element: <Overview/>, },
					{
						path: "books",
						element: <DefaultLayout/>,
						children: [
							{ index: true, element: <Departements/>, },
							{

								path: ":departmentName",
								element: <DefaultLayout/>,
								children: [
									{ index: true, element: <Catalogue/> },
									{ path: ":bookId", element: <BookDetails/> },
									{ path: "add", element: <AddBook/> }
								]
							}
						]
					},
					{
						path: "thesis",
						element: <DefaultLayout/>,
						children: [
							{ index: true, element: <ThesisDepartment/> },
							{
								path: ":departmentName",
								element: <DefaultLayout/>,
								children: [
									{ index: true, element: <ThesisCatalogue/> },
									{ path: ":thesisId", element: <ThesisDetails/> },
									{ path: "add", element: <AddThesis/> }
								]
							}
						]
					},
					{
						path: "messages",
						element: <Chat/>, // Chat est maintenant la page principale
						children: [
							{ path: ":conversationId", element: <Chat/> }
						]
					},
					{ path: "users", element: <Users/>, },
					{ path: "loans", element: <Loans/>, },
					{ path: "reservations", element: <Reservations/>, },
					{ path: "settings", element: <OrgConfiguration/>, },
					{ path: "archives", element: <Archives/>, },
					{ path: "profile", element: <Profile/>, },
					{ path: "*", element: <UnderDevelopment sectionName="Requested"/>, }
				]
			},
			{
				path: "users",
				element: <Users />,
			},
			{
				path: "loans",
				element: <Loans />,
			},
			{
				path: "reservations",
				element: <Reservations />,
			},
			{
				path: "settings",
				element: <OrgConfiguration />,
			},
			{
				path: "archives",
				element: <Archives/>,
			},
			{
				path: "profile",
				element: <Profile/>,
			},
			{
				path: "*",
				element: <UnderDevelopment sectionName="Requested" />,
			}
		]
	},
	{
		path: "*",
		element: <Navigate to="/" replace />
	},
]);

export default routes;
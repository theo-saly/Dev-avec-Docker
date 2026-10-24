import React, { useState, useEffect, useMemo } from 'react';
import { normalizePath, matchPath, decodeToken } from '../utils/navigation';
import { setUnauthorizedHandler } from '../utils/api';
import Navbar from './Navbar';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import EventsPage from '../pages/EventsPage';
import EventDetailPage from '../pages/EventDetailPage';
import MyTicketsPage from '../pages/MyTicketsPage';
import AccountPage from '../pages/AccountPage';
import AdminEventsPage from '../pages/AdminEventsPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import type { Message, PageProps } from '../types';

type Access = 'public' | 'auth' | 'admin';

interface RouteDef {
    path: string;
    access: Access;
    // Pages d'authentification : sans en-tête, avec l'écran scindé.
    fullScreen?: boolean;
    page: React.ComponentType<any>;
}

// Table de routes unique : un niveau d'accès par route. Le masquage côté
// front est du confort ; la vraie protection, ce sont les 401/403 des backends.
const ROUTES: RouteDef[] = [
    { path: '/', access: 'public', page: HomePage },
    { path: '/login', access: 'public', fullScreen: true, page: LoginPage },
    {
        path: '/register',
        access: 'public',
        fullScreen: true,
        page: RegisterPage,
    },
    { path: '/events', access: 'auth', page: EventsPage },
    { path: '/events/:id', access: 'auth', page: EventDetailPage },
    { path: '/my-tickets', access: 'auth', page: MyTicketsPage },
    { path: '/account', access: 'auth', page: AccountPage },
    { path: '/admin/events', access: 'admin', page: AdminEventsPage },
    { path: '/admin/users', access: 'admin', page: AdminUsersPage },
];

function findRoute(path: string) {
    for (const route of ROUTES) {
        const params = matchPath(route.path, path);
        if (params) return { route, params };
    }
    return null;
}

export default function App() {
    const [token, setToken] = useState<string>(
        () => localStorage.getItem('authToken') || '',
    );
    const [path, setPath] = useState<string>(() =>
        normalizePath(window.location.pathname),
    );
    const [message, setMessage] = useState<Message>({ type: '', text: '' });

    // Un token expiré est considéré comme absent.
    const user = useMemo(() => decodeToken(token), [token, path]);

    const navigate = (newPath: string) => {
        const normalized = normalizePath(newPath);
        if (normalized === path) return;
        window.history.pushState({}, '', normalized);
        setPath(normalized);
    };

    const pushMessage = (type: string, text: string) =>
        setMessage({ type, text });

    const logout = () => {
        setToken('');
        pushMessage('success', 'Vous avez été déconnecté.');
        navigate('/');
    };

    useEffect(() => {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }, [token]);

    // Toute réponse 401 de l'API : suppression du token et retour au login.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            setToken('');
            pushMessage('danger', 'Session expirée, veuillez vous reconnecter.');
            window.history.pushState({}, '', '/login');
            setPath('/login');
        });
    }, []);

    useEffect(() => {
        const onPopState = () =>
            setPath(normalizePath(window.location.pathname));
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const match = findRoute(path);
    const access = match?.route.access;
    const mustLogin = (access === 'auth' || access === 'admin') && !user;
    const alreadyLogged = !!user && (path === '/login' || path === '/register');

    useEffect(() => {
        if (token && !user) setToken('');
        if (mustLogin) navigate('/login');
        else if (alreadyLogged) navigate('/events');
    }, [token, path]);

    const fullScreen = !!match?.route.fullScreen;

    useEffect(() => {
        document.body.classList.toggle('auth-no-scroll', fullScreen);
        return () => document.body.classList.remove('auth-no-scroll');
    }, [fullScreen]);

    const props: PageProps & { message: Message } = {
        token,
        user,
        params: match?.params ?? {},
        setToken,
        navigate,
        pushMessage,
        message,
    };

    let content: React.ReactNode;
    if (!match) {
        content = <NotFoundPage {...props} />;
    } else if (mustLogin || alreadyLogged) {
        content = null; // redirection en cours
    } else if (access === 'admin' && user?.role !== 'admin') {
        content = <ForbiddenPage {...props} />;
    } else {
        const Page = match.route.page;
        content = <Page key={path} {...props} />;
    }

    return (
        <div className="app-shell min-vh-100">
            {!fullScreen && (
                <Navbar user={user} navigate={navigate} onLogout={logout} />
            )}
            <main className={fullScreen ? 'auth-main' : 'container pb-5'}>
                {!fullScreen && message.text && (
                    <div
                        className={`alert alert-${message.type === 'danger' ? 'danger' : 'success'} mb-4 mt-3`}
                        role="alert"
                    >
                        {message.text}
                    </div>
                )}
                {content}
            </main>
        </div>
    );
}

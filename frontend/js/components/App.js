function App() {
    // JWT
    const [token, setToken] = React.useState(
        () => localStorage.getItem('authToken') || '',
    );
    const [path, setPath] = React.useState(() =>
        normalizePath(window.location.pathname),
    );
    const [message, setMessage] = React.useState({ type: '', text: '' });
    const [busy, setBusy] = React.useState(false);

    // nav
    const navigate = (newPath) => {
        const normalized = normalizePath(newPath);
        if (normalized === path) return;
        window.history.pushState({}, '', normalized);
        setPath(normalized);
    };

    // routes
    const projectIdFromPath = matchProjectPath(path);
    const isLoginPath = path === '/login';
    const isRegisterPath = path === '/register';
    const isAuthPath = isLoginPath || isRegisterPath;
    const isProjectListPath = path === '/projects';
    const isProjectFocusPath = !!projectIdFromPath;

    // EFFETS
    // token localStorage
    React.useEffect(() => {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }, [token]);

    // Écouter les changements de l'historique du navigateur
    React.useEffect(() => {
        const onPopState = () => {
            setPath(normalizePath(window.location.pathname));
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    // accès et redirection
    React.useEffect(() => {
        // Si pas co mais sur une page protégée -> vers login
        if (!token && (isProjectListPath || isProjectFocusPath)) {
            navigate('/login');
            return;
        }

        // Si connecté mais sur une page d'auth -> vers projets
        if (token && isAuthPath) {
            navigate('/projects');
            return;
        }

        // si co -> vers projets
        if (path === '/') {
            navigate(token ? '/projects' : '/login');
            return;
        }

        // default
        if (
            !isAuthPath &&
            !isProjectListPath &&
            !isProjectFocusPath &&
            path !== '/'
        ) {
            navigate(token ? '/projects' : '/login');
        }
    }, [token, path]);

    // regle scroll pages auth
    React.useEffect(() => {
        if (isAuthPath) {
            document.body.classList.add('auth-no-scroll');
        } else {
            document.body.classList.remove('auth-no-scroll');
        }
        return () => document.body.classList.remove('auth-no-scroll');
    }, [isAuthPath]);

    // gestion messages
    const pushMessage = (type, text) => {
        setMessage({ type, text });
    };

    const clearMessage = () => {
        setMessage({ type: '', text: '' });
    };

    // auth
    const login = async (credentials) => {
        setBusy(true);
        clearMessage();
        try {
            const response = await fetch(apiUrl('/auth/login'), {
                method: 'POST',
                headers: buildHeaders('', true),
                body: JSON.stringify(credentials),
            });

            const payload = await parseApiResponse(response);
            if (!payload.token) {
                throw new Error('Token JWT manquant dans la reponse');
            }

            setToken(payload.token);
            pushMessage('success', 'Connexion reussie.');
            navigate('/projects');
        } catch (err) {
            pushMessage('danger', err.message);
            throw err;
        } finally {
            setBusy(false);
        }
    };

    const register = async (payload) => {
        setBusy(true);
        clearMessage();
        try {
            const response = await fetch(apiUrl('/auth/register'), {
                method: 'POST',
                headers: buildHeaders('', true),
                body: JSON.stringify(payload),
            });

            await parseApiResponse(response);
            pushMessage(
                'success',
                'Compte créé. Vous pouvez maintenant vous connecter.',
            );
            navigate('/login');
        } catch (err) {
            pushMessage('danger', err.message);
            throw err;
        } finally {
            setBusy(false);
        }
    };

    const logout = () => {
        setToken('');
        pushMessage('success', 'Vous avez été déconnecté.');
        navigate('/login');
    };

    const deleteAccount = async () => {
        setBusy(true);
        clearMessage();
        try {
            const res = await fetch(apiUrl('/auth/profile'), {
                method: 'DELETE',
                headers: buildHeaders(token, false),
            });

            const data = await parseApiResponse(res);
            setToken('');
            pushMessage(
                'success',
                data.message || 'Votre compte à bien été supprimé.',
            );
            navigate('/login');
        } catch (err) {
            pushMessage('danger', err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="app-shell min-vh-100">
            {!isAuthPath && (
                <header className="topbar container-fluid py-3 px-3 px-md-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div>
                            <div className="brand-mark">
                                Kanban Project Manager
                            </div>
                            <small className="text-muted">
                                Par Saly Théo & Inacio Rodrigues
                            </small>
                        </div>

                        {token && (
                            <div className="d-flex gap-2 flex-wrap">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate('/projects')}
                                >
                                    Projets
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={deleteAccount}
                                    disabled={busy}
                                >
                                    Supprimer mon compte
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-dark"
                                    onClick={logout}
                                    disabled={busy}
                                >
                                    Deconnexion
                                </button>
                            </div>
                        )}
                    </div>
                </header>
            )}

            <main className={isAuthPath ? 'auth-main' : 'container pb-5'}>
                {isLoginPath && (
                    <LoginPage
                        busy={busy}
                        message={message}
                        onLogin={login}
                        goToRegister={() => {
                            clearMessage();
                            navigate('/register');
                        }}
                    />
                )}

                {isRegisterPath && (
                    <RegisterPage
                        busy={busy}
                        message={message}
                        onRegister={register}
                        goToLogin={() => {
                            clearMessage();
                            navigate('/login');
                        }}
                    />
                )}

                {!isAuthPath && message.text && (
                    <div
                        className={`alert alert-${message.type === 'danger' ? 'danger' : 'success'} mb-4 mt-3`}
                        role="alert"
                    >
                        {message.text}
                    </div>
                )}

                {token && isProjectListPath && (
                    <DashboardPage
                        token={token}
                        navigate={navigate}
                        busy={busy}
                        setBusy={setBusy}
                        pushMessage={pushMessage}
                    />
                )}

                {token && isProjectFocusPath && (
                    <ProjectPage
                        token={token}
                        projectId={projectIdFromPath}
                        navigate={navigate}
                        busy={busy}
                        setBusy={setBusy}
                        pushMessage={pushMessage}
                    />
                )}
            </main>
        </div>
    );
}

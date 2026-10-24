import getProjects from '../controllers/getProject';
import addProject from '../controllers/addProject';
import updateProject from '../controllers/updateProject';
import deleteProject from '../controllers/deleteProject';

const registerProjectRoutes = (app, prefix = '') => {
    app.get(`${prefix}/projects`, getProjects);
    app.get(`${prefix}/projects/:id`, getProjects);
    app.post(`${prefix}/projects`, addProject);
    app.put(`${prefix}/projects/:id`, updateProject);
    app.delete(`${prefix}/projects/:id`, deleteProject);
};

export default (app) => {
    registerProjectRoutes(app);
    registerProjectRoutes(app, '/v1');
};

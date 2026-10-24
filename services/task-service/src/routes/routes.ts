import getTasks from '../controllers/getTask';
import getTasksByProject from '../controllers/getTasksByProject';
import addTask from '../controllers/addTask';
import updateTask from '../controllers/updateTask';
import deleteTask from '../controllers/deleteTask';

const registerTaskRoutes = (app, prefix = '') => {
    app.get(`${prefix}/tasks`, getTasks);
    app.get(`${prefix}/tasks/by-project`, getTasksByProject);
    app.post(`${prefix}/tasks`, addTask);
    app.put(`${prefix}/tasks/:id`, updateTask);
    app.delete(`${prefix}/tasks/:id`, deleteTask);
};

export default (app) => {
    registerTaskRoutes(app);
    registerTaskRoutes(app, '/v1');
};

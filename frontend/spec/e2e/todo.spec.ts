import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

const BASE_URL = 'http://localhost:3000';

async function registerUser(page, email, password) {
    await page.goto(BASE_URL);
    await expect(page.locator('#login-form')).toBeVisible();

    await page.getByRole('button', { name: 'Creer un compte' }).click();
    await expect(page.locator('#register-form')).toBeVisible();

    await page.fill('#register-form input[type="email"]', email);
    await page.fill('#register-form input[type="password"]', password);
    await page.check('#consentCheck');
    await page.click('#register-form button[type="submit"]');

    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText(
        'Compte créé. Vous pouvez maintenant vous connecter.',
    );
}

async function loginUser(page, email, password) {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('#login-form')).toBeVisible();

    await page.fill('#login-form input[type="email"]', email);
    await page.fill('#login-form input[type="password"]', password);
    await page.click('#login-form button[type="submit"]');

    await expect(page.getByText('Liste des projets')).toBeVisible();
}

async function createProject(page, projectName) {
    await page.fill(
        'input[placeholder="Ex: Refonte espace client"]',
        projectName,
    );
    await page.fill(
        'input[placeholder="Objectif du projet"]',
        'Validation du workflow complet',
    );
    await page.click('button:has-text("Ajouter")');

    await expect(page.getByText('Focus projet')).toBeVisible();
}

async function createTask(page, taskTitle) {
    await expect(page.locator('#task-form')).toBeVisible();

    await page.locator('#task-form input').first().fill(taskTitle);
    await page
        .locator('#task-form input')
        .nth(1)
        .fill('Realiser la premiere tache du projet');
    await page.click('#task-form button[type="submit"]');

    await expect(
        page.locator('article.task-item h3', { hasText: taskTitle }),
    ).toBeVisible();
}

async function completeTask(page, taskTitle) {
    const taskItem = page.locator('article.task-item', {
        has: page.locator('h3', { hasText: taskTitle }),
    });

    await taskItem.getByRole('button', { name: 'Terminer' }).click();
    await expect(taskItem.locator('span.badge')).toContainText('terminé');
}

test.describe('Workflow Front E2E', () => {
    test('Inscription', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';

        await registerUser(page, email, password);
    });

    test('Connexion', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';

        await registerUser(page, email, password);
        await loginUser(page, email, password);
    });

    test('Creation projet', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
    });

    test('Modification projet nom et desc', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const nextProjectName = `Projet E2E Modifie ${seed}`;
        const nextProjectDescription = `Description modifiee ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);

        const projectForm = page.locator(
            'section.card form.row.g-3.align-items-end',
        );
        await projectForm.locator('input').first().fill(nextProjectName);
        await projectForm.locator('input').nth(1).fill(nextProjectDescription);
        await projectForm.locator('button[type="submit"]').click();

        await expect(page.locator('.alert-success')).toContainText(
            'Le projet a bien été mis à jour.',
        );
        await expect(projectForm.locator('input').first()).toHaveValue(
            nextProjectName,
        );
        await expect(projectForm.locator('input').nth(1)).toHaveValue(
            nextProjectDescription,
        );
    });

    test('Creation tache', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);
    });

    test('Modification tache nom et desc', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;
        const nextTaskTitle = `Tache E2E Modifiee ${seed}`;
        const nextTaskDescription = `Description tache modifiee ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        const taskItem = page.locator('article.task-item', {
            has: page.locator('h3', { hasText: taskTitle }),
        });
        await taskItem.getByRole('button', { name: 'Modifier' }).click();

        const editingTaskItem = page.locator('article.task-item', {
            has: page.getByRole('button', { name: 'Annuler' }),
        });
        await editingTaskItem.locator('input').first().fill(nextTaskTitle);
        await editingTaskItem.locator('input').nth(1).fill(nextTaskDescription);
        await editingTaskItem
            .getByRole('button', { name: 'Enregistrer' })
            .click();

        await expect(page.locator('.alert-success')).toContainText(
            'Tache mise a jour.',
        );
        await expect(
            page.locator('article.task-item h3', { hasText: nextTaskTitle }),
        ).toBeVisible();
        await expect(
            page.locator('article.task-item p', {
                hasText: nextTaskDescription,
            }),
        ).toBeVisible();
    });

    test('Completion tache', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        await completeTask(page, taskTitle);
    });

    test('Cloture projet', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        await completeTask(page, taskTitle);
        await page.getByRole('button', { name: 'Cloturer le projet' }).click();
        await expect(page.locator('.alert-success')).toContainText(
            'Le projet a bien été cloturé.',
        );
        await expect(page.locator('span.badge.fs-6')).toContainText('cloturé');
    });

    test('Refus cloture projet si tache non terminee', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        await page.getByRole('button', { name: 'Cloturer le projet' }).click();

        await expect(page.locator('.alert-danger')).toContainText(
            'Toutes les tâches doivent être terminées pour clôturer le projet',
        );
        await expect(page.locator('span.badge.fs-6')).toContainText('ouvert');
    });

    test('Impossible d ajouter une tache si projet cloture', async ({
        page,
    }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        await completeTask(page, taskTitle);
        await page.getByRole('button', { name: 'Cloturer le projet' }).click();

        await expect(page.locator('.alert-warning')).toContainText(
            'Ce projet est clôturé: vous ne pouvez plus ajouter de nouvelles taches.',
        );
        await expect(page.locator('#task-form input').first()).toBeDisabled();
        await expect(page.locator('#task-form input').nth(1)).toBeDisabled();
        await expect(page.locator('#task-form select')).toBeDisabled();
        await expect(
            page.locator('#task-form button[type="submit"]'),
        ).toBeDisabled();

        await expect(page.locator('article.task-item')).toHaveCount(1);
    });

    test('Reouvrir projet', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        await completeTask(page, taskTitle);
        await page.getByRole('button', { name: 'Cloturer le projet' }).click();
        await expect(page.locator('span.badge.fs-6')).toContainText('cloturé');

        await page.getByRole('button', { name: 'Reouvrir le projet' }).click();

        await expect(page.locator('.alert-success')).toContainText(
            'Le projet a bien été ouvert.',
        );
        await expect(page.locator('span.badge.fs-6')).toContainText('ouvert');
        await expect(
            page.locator('#task-form button[type="submit"]'),
        ).toBeEnabled();
    });

    test('Suppression tache', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;
        const taskTitle = `Tache E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);
        await createTask(page, taskTitle);

        await expect(page.locator('article.task-item')).toHaveCount(1);

        const taskItem = page.locator('article.task-item', {
            has: page.locator('h3', { hasText: taskTitle }),
        });
        await taskItem.locator('button:has-text("Supprimer")').click();

        await expect(page.locator('article.task-item')).toHaveCount(0);
        await expect(page.locator('.alert-success')).toContainText(
            'Tache supprimee.',
        );
    });

    test('Suppression projet', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';
        const projectName = `Projet E2E ${seed}`;

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await createProject(page, projectName);

        await page.getByRole('button', { name: 'Retour a la liste' }).click();
        await expect(page.getByText('Liste des projets')).toBeVisible();

        const projectRow = page.locator('tr').filter({
            hasText: projectName,
        });

        await projectRow
            .locator('button:has-text("Supprimer")')
            .first()
            .click();

        await expect(page.locator('.alert-success')).toContainText(
            'Votre projet a bien été supprimé.',
        );
    });

    test('Suppression utilisateur', async ({ page }) => {
        const seed = Date.now();
        const email = `e2e.${seed}@example.com`;
        const password = 'Passw0rd!';

        await registerUser(page, email, password);
        await loginUser(page, email, password);
        await expect(page.getByText('Liste des projets')).toBeVisible();

        await page
            .getByRole('button', { name: 'Supprimer mon compte' })
            .click();

        await expect(page.locator('#login-form')).toBeVisible();
        await expect(page.locator('.alert-success')).toContainText(
            'Votre compte a bien été supprimé.',
        );
    });

    test('Check log notification-service', async () => {
        const logs = execSync(
            'docker compose logs --no-color --tail=200 notification-service',
            {
                encoding: 'utf-8',
            },
        );

        expect(logs).toContain('Notification service listening on port 3004');

        expect(logs).toMatch(/EVENT → Tâche terminée :/);
    });
});

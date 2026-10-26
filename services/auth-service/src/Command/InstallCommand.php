<?php

namespace App\Command;

use App\Repository\UserRepository;
use App\Service\AuthService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * À lancer au démarrage du conteneur : crée la table et le compte admin initial.
 * Idempotente : peut être relancée sans effet de bord.
 */
#[AsCommand(name: 'app:install', description: 'Crée la table users et le compte admin initial')]
final class InstallCommand extends Command
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly AuthService $auth,
        #[Autowire(env: 'ADMIN_EMAIL')] private readonly string $adminEmail,
        #[Autowire(env: 'ADMIN_PASSWORD')] private readonly string $adminPassword,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->users->initialize();
        $output->writeln('Table users prête.');

        if ('' === $this->adminEmail || '' === $this->adminPassword) {
            $output->writeln('ADMIN_EMAIL ou ADMIN_PASSWORD vide : aucun admin créé.');

            return Command::SUCCESS;
        }

        $created = $this->auth->ensureAdmin($this->adminEmail, $this->adminPassword);
        $output->writeln($created ? "Admin {$this->adminEmail} créé." : "Admin {$this->adminEmail} déjà présent.");

        return Command::SUCCESS;
    }
}

import { createMemoryRepositories } from '../../src/data/memory/repos';
import { repositoryContract } from './repos.contract';

repositoryContract('in-memory', createMemoryRepositories);

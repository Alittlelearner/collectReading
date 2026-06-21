import { create } from 'zustand';
import { WikiSpace } from '../types';
import { WikiService } from '../services/wikiService';

const wikiService = new WikiService();

interface WikiState {
  spaces: WikiSpace[];
  loading: boolean;
  loadSpaces: () => Promise<void>;
  createSpace: (input: {
    name: string;
    description?: string;
    grouping: WikiSpace['grouping'];
    filter: WikiSpace['filter'];
  }) => Promise<WikiSpace>;
  updateSpace: (
    id: string,
    input: Partial<{
      name: string;
      description: string;
      grouping: WikiSpace['grouping'];
      filter: WikiSpace['filter'];
    }>,
  ) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
}

export const useWikiStore = create<WikiState>((set) => ({
  spaces: [],
  loading: false,

  loadSpaces: async () => {
    set({ loading: true });
    await wikiService.ensureDefaultSpaces();
    const spaces = await wikiService.getAllSpaces();
    set({ spaces, loading: false });
  },

  createSpace: async (input) => {
    const space = await wikiService.createSpace(input);
    await useWikiStore.getState().loadSpaces();
    return space;
  },

  updateSpace: async (id, input) => {
    await wikiService.updateSpace(id, input);
    await useWikiStore.getState().loadSpaces();
  },

  deleteSpace: async (id) => {
    await wikiService.deleteSpace(id);
    await useWikiStore.getState().loadSpaces();
  },
}));

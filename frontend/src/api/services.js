import { mockClasses } from './mockData';

export const getClasses = async () => {
  // Имитируем задержку интернета 500мс
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockClasses; 
};

import { useEffect } from 'react';

interface PageTitleOptions {
  title: string;
  description?: string;
}

export const usePageTitle = ({ title, description }: PageTitleOptions) => {
  useEffect(() => {
    // 更新頁面標題
    const fullTitle = `${title} | Blockfall - Free Online Tetris Game`;
    document.title = fullTitle;
    
    // 更新meta描述（如果提供）
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', description);
        document.head.appendChild(metaDescription);
      }
    }
    
    // 清理函數：恢復默認標題
    return () => {
      document.title = 'Blockfall - Free Online Tetris Game | Play Classic Puzzle Game';
    };
  }, [title, description]);
};

// 預定義的頁面SEO數據
export const PAGE_SEO_DATA = {
  home: {
    title: 'Home',
    description: 'Play Blockfall, the ultimate free online Tetris game! Enjoy classic block-falling puzzle gameplay with multiplayer mode, leaderboards, and smooth controls.'
  },
  singlePlayer: {
    title: 'Single Player',
    description: 'Play Tetris in single player mode. Challenge yourself with classic block-falling puzzle gameplay and try to achieve the highest score!'
  },
  multiplayer: {
    title: 'Multiplayer',
    description: 'Play Tetris with friends online! Join multiplayer rooms and compete in real-time block-falling puzzle battles.'
  },
  leaderboard: {
    title: 'Leaderboard',
    description: 'Check the global leaderboard and see how you rank against other Tetris players worldwide. Compete for the top scores!'
  },
  stats: {
    title: 'Statistics',
    description: 'View your personal Tetris game statistics, including games played, high scores, and performance metrics.'
  },
  settings: {
    title: 'Settings',
    description: 'Customize your Tetris game experience. Adjust controls, graphics, sound settings, and language preferences.'
  },
  login: {
    title: 'Login',
    description: 'Sign in to your Blockfall account to save your progress, compete on leaderboards, and play multiplayer Tetris games.'
  }
};
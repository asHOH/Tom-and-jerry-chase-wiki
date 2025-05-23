'use client';

import { useState } from 'react';
import Image from 'next/image';
import TabNavigation from '@/components/TabNavigation';
import FactionCharacters from '@/components/FactionCharacters';
import CharacterDetails from '@/components/CharacterDetails';
import { factions, characters } from '@/data/mockData';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isDetailedView, setIsDetailedView] = useState<boolean>(false);

  const handleTabChange = (tabId: string) => {
    // If tabId is empty string, set activeTab to null (home page)
    setActiveTab(tabId === '' ? null : tabId);
    setSelectedCharacter(null);
  };

  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  const toggleDetailedView = () => {
    setIsDetailedView(!isDetailedView);
  };

  // Render content based on state
  const renderContent = () => {
    // If a character is selected, show character details
    if (selectedCharacter && characters[selectedCharacter]) {
      // Pass the isDetailedView state to the CharacterDetails component
      return (
        <CharacterDetails
          character={characters[selectedCharacter]}
          isDetailedView={isDetailedView}
        />
      );
    }

    // If a faction tab is active, show faction characters
    if (activeTab && factions[activeTab]) {
      return (
        <FactionCharacters
          faction={factions[activeTab]}
          onSelectCharacter={handleSelectCharacter}
        />
      );
    }

    // Default: show home page content
    return (
      <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-blue-600">猫和老鼠角色数据库</h1>
          <p className="text-xl text-gray-600">
            查询角色技能、属性和数据
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div
            className="card flex flex-col items-center p-8 hover:border-blue-500 hover:border-2 cursor-pointer"
            onClick={() => handleTabChange('cat')}
          >
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-6xl">🐱</span>
            </div>
            <h2 className="text-2xl font-bold text-center">猫阵营</h2>
            <p className="text-gray-600 text-center mt-2">
              查看猫阵营角色列表
            </p>
          </div>

          <div
            className="card flex flex-col items-center p-8 hover:border-blue-500 hover:border-2 cursor-pointer"
            onClick={() => handleTabChange('mouse')}
          >
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-6xl">🐭</span>
            </div>
            <h2 className="text-2xl font-bold text-center">鼠阵营</h2>
            <p className="text-gray-600 text-center mt-2">
              查看鼠阵营角色列表
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">数据说明</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            本网站为粉丝制作，仅供学习交流使用，并非官方网站。数据仅供参考，实际游戏数值可能因版本更新而有所变化。
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Always show tab navigation, now fixed at the top */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDetailedView={isDetailedView}
        onToggleDetailedView={toggleDetailedView}
        showDetailToggle={!!selectedCharacter} // Only show toggle when a character is selected
      />

      {/* Content container with padding for fixed navbar */}
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Render content based on state */}
        {renderContent()}
      </div>
    </div>
  );
}

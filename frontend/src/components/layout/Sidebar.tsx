import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderOpen,
} from 'lucide-react';

import { ConversationSummary } from '../../types';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewAnalysis: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewAnalysis,
  onDeleteConversation,
  isOpen,
  onToggleOpen,
}) => {
  const groupConversations = () => {
    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const earlier: ConversationSummary[] = [];

    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(
      startOfYesterday.getDate() - 1
    );

    conversations.forEach((conversation) => {
      const date = new Date(conversation.updated_at);

      if (date >= startOfToday) {
        today.push(conversation);
      } else if (date >= startOfYesterday) {
        yesterday.push(conversation);
      } else {
        earlier.push(conversation);
      }
    });

    return {
      today,
      yesterday,
      earlier,
    };
  };

  const {
    today,
    yesterday,
    earlier,
  } = groupConversations();


  /* ---------------------------------------
     Collapsed sidebar
  --------------------------------------- */

  if (!isOpen) {
    return (
      <aside className="w-[68px] shrink-0 bg-[#0B3325] text-white flex flex-col items-center border-r border-[#174A35]">

        <button
          type="button"
          onClick={onToggleOpen}
          className="mt-5 w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
          title="Open scenes"
        >
          <ChevronRight className="w-5 h-5" />
        </button>


        <button
          type="button"
          onClick={onNewAnalysis}
          className="mt-6 w-10 h-10 rounded-lg bg-[#2C8A58] hover:bg-[#3A9B67] flex items-center justify-center transition"
          title="New analysis"
        >
          <Plus className="w-5 h-5" />
        </button>


        <div className="mt-8 flex-1 flex flex-col items-center gap-3 overflow-y-auto">

          {conversations.map((conversation) => (

            <button
              type="button"
              key={conversation.id}
              onClick={() =>
                onSelectConversation(conversation.id)
              }
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                activeConversationId === conversation.id
                  ? 'bg-white/15 text-white'
                  : 'text-[#9EC2AC] hover:bg-white/10'
              }`}
              title={
                conversation.title ||
                'SAR Analysis'
              }
            >
              <MessageSquare className="w-4 h-4" />
            </button>

          ))}

        </div>

      </aside>
    );
  }


  /* ---------------------------------------
     Conversation card
  --------------------------------------- */

  const renderConversation = (
    conversation: ConversationSummary
  ) => {

    const active =
      conversation.id === activeConversationId;

    const updatedDate =
      new Date(conversation.updated_at);

    const time =
      updatedDate.toLocaleTimeString(
        undefined,
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      );

    return (
      <div
        key={conversation.id}
        className={`group relative rounded-xl cursor-pointer transition-all ${
          active
            ? 'bg-[#DCEFE2] shadow-sm'
            : 'hover:bg-white/5'
        }`}
        onClick={() =>
          onSelectConversation(conversation.id)
        }
      >

        <div className="flex items-center gap-3 px-3 py-3">

          {/* Scene icon */}

          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              active
                ? 'bg-[#C6E2CE]'
                : 'bg-[#123D2D]'
            }`}
          >

            <MessageSquare
              className={`w-4 h-4 ${
                active
                  ? 'text-[#176344]'
                  : 'text-[#709786]'
              }`}
            />

          </div>


          {/* Scene information */}

          <div className="min-w-0 flex-1 pr-6">

            <p
              className={`text-sm font-semibold truncate ${
                active
                  ? 'text-[#123A29]'
                  : 'text-white'
              }`}
            >
              {conversation.title ||
                'SAR Analysis'}
            </p>


            <div className="flex items-center gap-2 mt-1">

              <span
                className={`text-[10px] ${
                  active
                    ? 'text-[#56806B]'
                    : 'text-[#76988A]'
                }`}
              >
                {updatedDate.toLocaleDateString(
                  undefined,
                  {
                    month: 'short',
                    day: 'numeric',
                  }
                )}
              </span>


              <span
                className={`text-[10px] ${
                  active
                    ? 'text-[#81A693]'
                    : 'text-[#557768]'
                }`}
              >
                ·
              </span>


              <span
                className={`text-[10px] ${
                  active
                    ? 'text-[#56806B]'
                    : 'text-[#76988A]'
                }`}
              >
                {time}
              </span>

            </div>

          </div>


          {/* Delete */}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onDeleteConversation(
                conversation.id
              );
            }}
            className={`absolute right-2 top-1/2 -translate-y-1/2
                        p-1.5 rounded-md
                        opacity-0 group-hover:opacity-100
                        transition-all
                        ${
                          active
                            ? 'text-[#789687] hover:text-[#B44B40] hover:bg-white'
                            : 'text-[#66897A] hover:text-[#E08A7F] hover:bg-white/10'
                        }`}
            title="Delete scene"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    );
  };


  /* ---------------------------------------
     Conversation group
  --------------------------------------- */

  const renderGroup = (
    label: string,
    items: ConversationSummary[]
  ) => {

    if (items.length === 0) {
      return null;
    }

    return (
      <div className="mb-6">

        <div className="flex items-center justify-between px-3 mb-2">

          <div className="text-[10px] font-semibold tracking-widest uppercase text-[#6E987F]">
            {label}
          </div>

          <div className="text-[10px] text-[#527967]">
            {items.length}
          </div>

        </div>


        <div className="space-y-1">
          {items.map(renderConversation)}
        </div>

      </div>
    );
  };


  return (
    <aside className="w-[240px] shrink-0 bg-[#0B3325] text-white flex flex-col">


      {/* ---------------------------------------
          BRAND
      --------------------------------------- */}

      <div className="px-5 pt-6 pb-7">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">

            <span className="text-[#176344] text-xl">
              ◉
            </span>

          </div>


          <div>

            <div className="text-lg font-bold">
              SAR Analysis
            </div>

            <div className="text-[11px] text-[#9FC3AF]">
              Earth Observation
            </div>

          </div>

        </div>

      </div>


      {/* ---------------------------------------
          NEW ANALYSIS
      --------------------------------------- */}

      <div className="px-3">

        <button
          type="button"
          onClick={onNewAnalysis}
          className="w-full h-11 rounded-lg
                     bg-[#1C6948]
                     hover:bg-[#267C55]
                     flex items-center gap-3
                     px-4
                     text-sm font-semibold
                     transition shadow-sm"
        >

          <Plus className="w-5 h-5" />

          New Analysis

        </button>

      </div>


      {/* ---------------------------------------
          NAVIGATION
      --------------------------------------- */}

      <div className="px-3 mt-7">

        <div className="px-3 mb-3 text-[11px] font-semibold tracking-wider text-[#78A28C] uppercase">
          Workspace
        </div>


        <div className="space-y-1">

          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/10 text-white">

            <div className="flex items-center gap-3">

              <FolderOpen className="w-[18px] h-[18px]" />

              <span className="text-sm font-medium">
                Scenes
              </span>

            </div>

            <span className="text-[10px] text-[#8EB6A1]">
              {conversations.length}
            </span>

          </div>


          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#9AB9A8]">

            <Clock3 className="w-[18px] h-[18px]" />

            <span className="text-sm">
              History
            </span>

          </div>

        </div>

      </div>


      {/* ---------------------------------------
          SCENES
      --------------------------------------- */}

      <div className="flex-1 overflow-y-auto mt-7 px-3">

        {renderGroup('Today', today)}

        {renderGroup('Yesterday', yesterday)}

        {renderGroup('Earlier', earlier)}


        {/* EMPTY */}

        {conversations.length === 0 && (

          <div className="px-4 py-10 text-center">

            <div className="w-11 h-11 mx-auto rounded-xl bg-white/5 flex items-center justify-center">

              <FolderOpen className="w-5 h-5 text-[#5D8872]" />

            </div>

            <p className="text-xs text-[#769B89] mt-3">
              No scenes yet
            </p>

            <p className="text-[10px] leading-5 text-[#527967] mt-1">
              Create a new analysis to get started.
            </p>

          </div>

        )}

      </div>


      {/* ---------------------------------------
          BOTTOM
      --------------------------------------- */}

      <div className="border-t border-[#174936] px-5 py-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold text-[#D3E6DA]">
              Sentinel-1
            </p>

            <p className="text-[10px] text-[#6F9983] mt-1">
              SAR imagery analysis
            </p>

          </div>


          <button
            type="button"
            onClick={onToggleOpen}
            className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center text-[#8DB19E] transition"
            title="Collapse sidebar"
          >

            <ChevronLeft className="w-4 h-4" />

          </button>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;
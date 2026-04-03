import React from 'react';
import { skills } from '../data/skills';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">About Me</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6">Introduction</h3>
            <p className="text-gray-300 mb-6">
              我是一名充满热情的技术型AI产品经理，深耕于Agent驱动的高效产研体系。我擅长利用Vibe Coding研发范式，通过整合Agent自动化技能 (Skills) 实现单人跨角色的端到端交付。
            </p>
            <p className="text-gray-300">
              我的方法结合了技术创新、产品思维和持续学习。我专注于解决复杂问题，并通过自动化工具提升研发效率，打造具有影响力的解决方案。
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6">Skills</h3>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="px-4 py-2 bg-gray-800 rounded-full text-gray-200 border border-gray-700"
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
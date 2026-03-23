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
              I'm a passionate full‑stack developer with expertise in modern web technologies.
              I love building intuitive, performant applications that provide great user experiences.
            </p>
            <p className="text-gray-300">
              My approach combines clean code, thoughtful design, and continuous learning.
              I enjoy tackling challenging problems and collaborating with teams to create impactful solutions.
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
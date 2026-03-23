import React from 'react';

const Contact: React.FC = () => {
  const socialLinks = [
    { name: 'Email', url: 'mailto:example@example.com', icon: '✉️' },
    { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
    { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
  ];

  return (
    <section id="contact" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Contact Me</h2>
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-300 text-center mb-10">
            Feel free to reach out if you're interested in collaborating, have questions,
            or just want to connect!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-700 hover:border-purple-500 transition-colors"
              >
                <div className="text-3xl mb-4">{link.icon}</div>
                <div className="text-white font-medium">{link.name}</div>
              </a>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-400">
              Alternatively, you can send me an email at{' '}
              <a href="mailto:example@example.com" className="text-purple-400 hover:underline">
                example@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
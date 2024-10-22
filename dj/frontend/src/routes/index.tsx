import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { Code, GithubIcon, Mail, Music } from 'lucide-react';
import figlet from 'figlet';


export const Route = createFileRoute('/')({
  component: Portfolio
})
interface TechStackProps {
  href: string;
  icon: string;
  shadowColor: string;
  name: string;
}

const TechStack = ({ href, icon, shadowColor, name }: TechStackProps) => (
  <a
    href={href}
    className={`flex items-center justify-center p-2 rounded-md bg-gray-800 transition-all duration-300 hover:scale-105 shadow-[0_0_10px_${shadowColor}]`}
    title={name}
  >
    <img
      src={icon}
      alt={`${name} Logo`}
      className="h-8 w-auto"
      style={{ filter: name.includes('SQL') || name.includes('Salt') ? 'invert(1)' : 'none' }}
    />
  </a>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
  href?: string;
}

const Section = ({ title, children, href }: SectionProps) => (
  <>
    <div className="divider">
      {href ? (
        <a href={href} className="link link-hover font-extrabold text-lg text-gray-100 hover:text-blue-400 transition-colors">
          {title}
        </a>
      ) : (
        <span className="font-extrabold text-lg text-gray-100">{title}</span>
      )}
    </div>
    <div className="text-slate-50">{children}</div>
  </>
);

export default function Portfolio() {
  const [asciiArt, setAsciiArt] = useState('');
  useEffect(() => {
    const loadAsciiArt = async () => {
      figlet.text('Hi there!', { font: 'Univers' }, (err, data) => {
        if (!err) setAsciiArt(data || '');
      });
    };
    loadAsciiArt();
  }, []);

  const techStack = [
    { name: 'Go', icon: '/images/Go-Logo_Aqua.svg', href: 'https://reddit.com/r/programmingcirclejerk/comments/13o6u9c/fuck_you_go/', shadowColor: 'rgba(0,128,255,0.5)' },
    { name: 'Python', icon: '/images/python-icon.svg', href: 'https://www.reddit.com/r/programmingcirclejerk/comments/m8mjt3/python_ist_a_piece_of_shit_it_shouldnt_be/', shadowColor: 'rgba(0,255,0,0.5)' },
    { name: 'FastAPI', icon: '/images/fastapi-icon.svg', href: 'https://www.reddit.com/r/programmingcirclejerk/comments/vpniv1/flask_is_my_go_to_for_just_getting_a_web_project/', shadowColor: 'rgba(0,255,0,0.5)' },
    { name: '.NET', icon: '/images/dotnet-icon.svg', href: 'https://www.reddit.com/r/programmingcirclejerk/comments/1902tfa/dotnet_and_c_make_me_feel_like_everything_else_is/', shadowColor: 'rgba(255,0,128,0.5)' },
    { name: 'MongoDB', icon: '/images/mongodb-icon.svg', href: 'https://www.youtube.com/watch?v=b2F-DItXtZs', shadowColor: 'rgba(0,255,0,0.5)' },
    { name: 'Typescript', icon: '/images/typescript.svg', href: 'https://www.reddit.com/r/programmingcirclejerk/comments/1aytq9l/i_even_pay_for_copilot_almost_exclusively_to/', shadowColor: 'rgba(255,0,0,0.5)' },
    { name: 'AWS', icon: '/images/aws-logo.svg', href: 'https://reddit.com/r/programmingcirclejerk/comments/1b6modu/an_online_wheel_of_fortune_was_implemented_using/', shadowColor: 'rgba(255,153,0,0.5)' },
    { name: 'SaltStack', icon: '/images/saltstack-icon.svg', href: '#', shadowColor: 'rgba(0,255,255,0.5)' },
    { name: 'Docker', icon: '/images/docker-icon.svg', href: 'https://reddit.com/r/programmingcirclejerk/comments/gaen3m/if_your_devs_dont_understand_docker_they_arent/', shadowColor: 'rgba(0,170,255,0.5)' },
  ];

  return (
    <div className="min-h-screen bg-base-200 bg-[url('/bg.webp')] bg-cover bg-center bg-fixed">
      <div className="container mx-auto px-4 py-8 bg-blend-normal backdrop-blur-sm text-white shadow-inner border border-white/10 bg-scanlines max-w-2xl text-center">
        <pre className="text-[7px] flex mx-auto justify-center text-gray-50 font-mono mb-8">
          {asciiArt}
        </pre>

        <Section title="Who are you?" href="https://www.youtube.com/watch?v=tzjrm0lWsqE">
          <p className="mb-4">
            Caner, 22 year old software developer from Turkey, studying Computer Engineering.
            Backend developer at awesome places for a couple years now.
          </p>
        </Section>

        <Section title="What do you do?" href={window.location.href}>
          <p className="mb-4">Mostly coding and listening to music.</p>

          <div className="grid grid-cols-3 gap-3 my-6 max-w-md mx-auto">
            {techStack.map((tech) => (
              <TechStack key={tech.name} {...tech} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <a
              href="https://rateyourmusic.com/~damacaner"
              className="flex items-center gap-2 link font-extrabold hover:text-blue-400 transition-colors"
            >
              <Music size={20} />
              Check RYM profile
            </a>
            <a
              href="https://code.cansu.dev"
              className="flex items-center gap-2 link font-extrabold hover:text-blue-400 transition-colors"
            >
              <Code size={20} />
              Try code playground
            </a>
          </div>
          I am also balding, if it counts.
        </Section>

        <Section title="How the f**k I pronounce your name?" href="https://www.youtube.com/watch?v=uiCFZQFR_gE">
          Caner is pronounced like "Janer", or simply "John", or even "Canoe".
        </Section>

        <Section title="...cansu.dev?" href={window.location.href}>
          <>
            Using <span className="text-red-600 font-extrabold">cansu.dev</span> because{' '}
            <a className="link text-red-600 font-extrabold hover:text-red-400 transition-colors" href="https://caner.dev">
              caner.dev
            </a>{' '}
            was already taken. Boo the original owner for doing nothing with such a special domain.
          </>
        </Section>

        <Section title="Contact" href="https://www.youtube.com/watch?v=FCXj64y8NBw">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:crystalcanyon@proton.me"
              className="flex items-center gap-2 link hover:text-blue-400 transition-colors"
            >
              <Mail size={20} />
              crystalcanyon@proton.me
            </a>
            <a
              href="https://github.com/damacaner"
              className="flex items-center gap-2 link hover:text-blue-400 transition-colors"
            >
              <GithubIcon size={20} />
              GitHub
            </a>
          </div>
        </Section>
      </div>
    </div>
  );
};
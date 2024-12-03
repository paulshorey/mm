'use client';

import { Accordion, Code } from '@mantine/core';

export default function Logs({ rows }: any) {
  let firstKey = '';

  const Sections = rows.map((row: any, index: number) => {
    const key = row.message + row.date;
    if (!firstKey) firstKey = key;
    const Icon = row.type === 'debug' ? '🐞' : '⚠️';
    const Value = (
      <span>
        <span className="">{row.message}</span>
        <span className="bg-gray-700 my-1 mx-4 pt-1 pb-1 px-2 rounded-md shadow-sm text-xs">
          {row.date?.substring(0, 16).replace('T', ' - ').replace('Z', '')}
        </span>
      </span>
    );
    return (
      <Accordion.Item key={key} value={key} defaultChecked={index === 0}>
        <Accordion.Control icon={Icon}>{Value}</Accordion.Control>
        <Accordion.Panel>
          <Code block>{row.stack}</Code>
        </Accordion.Panel>
      </Accordion.Item>
    );
  });

  return <Accordion defaultValue={firstKey}>{Sections}</Accordion>;
}

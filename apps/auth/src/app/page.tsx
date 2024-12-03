import Link from 'next/link';

export default async function () {
  return (
    <nav>
      <ul className="px-12 py-10">
        <li>
          <Link href="/logs">Logs</Link>
        </li>
      </ul>
    </nav>
  );
}

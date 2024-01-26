import { useEffect, useState } from 'react';

export default function useFetch(url: string, options: Object = {}) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(url, options);
        const json = await res.json();

        setResponse(json);
      } catch (error) {
        setError(error);
      }
    };

    fetchData();
  }, []);

  return { response, error };
}

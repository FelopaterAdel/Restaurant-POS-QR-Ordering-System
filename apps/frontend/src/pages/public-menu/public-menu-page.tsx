import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getApiErrorMessage } from "@/lib/api";
import { getPublicMenu, type PublicMenu } from "@/services/public-menu";

export function PublicMenuPage() {
  const { qrCode = "" } = useParams();
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMenu(null);
    setError(null);

    getPublicMenu(qrCode)
      .then((result) => {
        if (!cancelled) {
          setMenu(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrCode]);

  if (error) {
    return (
      <main className="public-menu">
        <p className="public-menu__error">{error}</p>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="public-menu">
        <p>Loading menu…</p>
      </main>
    );
  }

  return (
    <main className="public-menu">
      <h1 className="public-menu__title h2">
        Menu – Table {menu.table.number}
      </h1>
      {menu.categories.map((category) => (
        <section className="public-menu__category" key={category.id}>
          <h2 className="public-menu__category-name h3">{category.name}</h2>
          <ul className="public-menu__products">
            {category.products.map((product) => (
              <li className="public-menu__product" key={product.id}>
                <span>{product.name}</span>
                <span>{product.price}</span>
                {!product.isAvailable && (
                  <em className="public-menu__unavailable">Unavailable</em>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

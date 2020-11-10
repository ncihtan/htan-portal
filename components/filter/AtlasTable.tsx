import Link from "next/link";
import React from "react";
import { Atlas, Entity } from "../../lib/helpers";

export default class AtlasTable extends React.Component<
  { atlases: Atlas[] },
  { filteredEntitites: Entity[] }
> {
  constructor(props: any) {
    super(props);
  }

  render() {
    if (this.props.atlases) {
      return (
        <table className={"table table-striped"}>
          <thead>
            <tr>
              <th>Atlas ID</th>
              <th>Atlas Name</th>
            </tr>
          </thead>
          <tbody>
            {this.props.atlases.map((atlas) => {
              return (
                <tr>
                  <td>{atlas.htan_name}</td>
                  <td>{atlas.htan_name}</td>
                  <td>
                  <Link href={`./atlas/${atlas.htan_id.toLowerCase()}`}>
                     <a>Data Release</a>
                   </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    } else {
      return null;
    }
  }
}

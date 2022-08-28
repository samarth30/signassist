export enum EventType {
  Unknown = 'Unknown',
  TransferIn = 'TransferIn',
  TransferOut = 'TransferOut',
  Approval = 'Approval',
  ApprovalForAll = 'ApprovalForAll',
}

export enum TokenType {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  ERC20 = 'ERC20',
}

export class Event {
  constructor(
    public type: EventType,
    public tokenType: TokenType,
    public name: string | null,
    public symbol: string | null,
    public image: string | null,
    public amount: string | null,
    public decimals: number | null,
    public toAddress?: string | null,
    public contract_address?: string | null,
    public function_name?: string | null
  ) {}

  public static fromJSON(obj: any): Event {
    return new Event(
      obj.type,
      obj.tokenType,
      obj.name,
      obj.symbol,
      obj.image,
      obj.amount,
      obj.decimals,
      obj.toAddress,
      obj.contract_address,
      obj.function_name
    );
  }
}
export class Simulation {
  constructor(public date: number, public events: Event[]) {}

  public static fromJSON(obj: any): Simulation {
    return new Simulation(
      obj.date,
      obj.events.flatMap((event: any) => Event.fromJSON(event))
    );
  }
}

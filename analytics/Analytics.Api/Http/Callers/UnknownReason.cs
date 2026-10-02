namespace Analytics.Api.Http.Callers;

/// <summary>Why a visitor's country could not be worked out, without saying whose address it was.</summary>
public enum UnknownReason
{
    /// <summary>The request carried no forwarded address at all.</summary>
    NoAddress = 1,

    /// <summary>There was a header, but no hop of it could be read as an address.</summary>
    UnusableAddress,

    /// <summary>A private, shared, loopback or otherwise special address, which belongs to no country.</summary>
    NonPublicAddress,

    /// <summary>A public address the database has no country for.</summary>
    NotInDatabase,
}

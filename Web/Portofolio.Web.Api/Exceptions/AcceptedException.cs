namespace ToDo.RestApi.Exceptions
{
    public class AcceptedException : Exception
    {
        public sting CommandID {get;}

        public AcceptedException(string commandID):base(){CommandID =commandID;}
    }
}